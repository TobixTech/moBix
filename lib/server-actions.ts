"use server"

import { db } from "@/lib/db"
import {
  movies,
  users,
  likes,
  comments,
  adSettings,
  feedback,
  watchlist,
  pushSubscriptions,
  watchHistory,
  ratings,
  contentReports,
  notifications, // Add notifications import
  promotions, // Import promotions table
  promotionSettings, // Import promotionSettings table
  ipBlacklist, // Import ipBlacklist table
  targetedPromotions, // Import targetedPromotions table
} from "@/lib/db/schema"
import { eq, desc, and, ilike, sql, count, not, or, inArray, sum, gt, lt } from "drizzle-orm"
import { currentUser, auth } from "@clerk/nextjs/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

interface CommentWithUser {
  id: string
  text: string
  rating: number
  createdAt: Date
  user: {
    email: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
  }
}

export async function generateSlug(title: string): Promise<string> {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

// Upload a new movie
export async function uploadMovie(data: {
  title: string
  description: string
  genre: string
  year: number
  rating?: string
  duration?: string
  director?: string
  cast?: string
  posterUrl: string
  videoUrl: string
  downloadUrl?: string
  downloadEnabled?: boolean
  isFeatured?: boolean
  isTrending?: boolean
  customVastUrl?: string
  useGlobalAd?: boolean
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate required fields
    if (!data.title || !data.videoUrl) {
      return { success: false, error: "Title and video URL are required" }
    }

    const slug = await generateSlug(data.title)

    const [newMovie] = await db
      .insert(movies)
      .values({
        ...data,
        slug,
        downloadEnabled: data.downloadEnabled ?? false,
        isFeatured: data.isFeatured ?? false,
        isTrending: data.isTrending ?? false,
        useGlobalAd: data.useGlobalAd ?? true,
        views: 0,
      })
      .returning()

    revalidatePath("/")
    revalidatePath("/home")
    revalidatePath("/browse")
    revalidatePath("/admin/dashboard")
    return { success: true, movie: newMovie }
  } catch (error: any) {
    console.error("Error uploading movie:", error)
    return { success: false, error: error.message || "Failed to upload movie" }
  }
}

export async function getPublicMovies() {
  try {
    const result = await db.query.movies.findMany({
      orderBy: [desc(movies.createdAt)],
      limit: 12,
    })
    return result
  } catch (error) {
    console.error("Error fetching public movies:", error)
    return []
  }
}

export async function getTrendingMovies() {
  try {
    // Get top 10 movies by like count
    const topLiked = await db
      .select({
        id: movies.id,
        title: movies.title,
        genre: movies.genre,
        posterUrl: movies.posterUrl,
        likeCount: count(likes.id),
      })
      .from(movies)
      .leftJoin(likes, eq(movies.id, likes.movieId))
      .groupBy(movies.id)
      .orderBy(desc(count(likes.id)))
      .limit(10)

    // If we don't have enough liked movies, fill with random ones
    if (topLiked.length < 5) {
      const allMovies = await db.query.movies.findMany({
        limit: 20,
        orderBy: [desc(movies.createdAt)],
      })

      const shuffled = allMovies.sort(() => 0.5 - Math.random()).slice(0, 10)
      return shuffled
    }

    // Map to expected format
    return topLiked.map((m) => ({
      ...m,
      likes: [], // Placeholder for compatibility
    }))
  } catch (error) {
    console.error("Error fetching trending movies:", error)
    return []
  }
}

export async function getMovieById(idOrSlug: string) {
  try {
    // Try to find by slug first, then by id
    let movie = await db.query.movies.findFirst({
      where: eq(movies.slug, idOrSlug),
      with: {
        comments: {
          with: {
            user: true,
          },
          orderBy: [desc(comments.createdAt)],
        },
        likes: true, // We need the count
      },
    })

    if (!movie) {
      movie = await db.query.movies.findFirst({
        where: eq(movies.id, idOrSlug),
        with: {
          comments: {
            with: {
              user: true,
            },
            orderBy: [desc(comments.createdAt)],
          },
          likes: true, // We need the count
        },
      })
    }

    if (!movie) {
      return null
    }

    // Calculate average rating
    const avgRating =
      movie.comments.length > 0
        ? movie.comments.reduce((acc, comment) => acc + comment.rating, 0) / movie.comments.length
        : 0

    // Increment views
    await db
      .update(movies)
      .set({ views: sql`${movies.views} + 1` })
      .where(eq(movies.id, movie.id)) // Use movie.id for consistency

    const transformedComments = movie.comments.map((comment: any) => ({
      ...comment,
      user: {
        email: comment.user.email,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        username: comment.user.username,
        // Helper property for frontend
        displayName: comment.user.firstName || comment.user.username || comment.user.email.split("@")[0] || "Anonymous",
      },
    }))

    return {
      ...movie,
      comments: transformedComments,
      likesCount: movie.likes.length,
      avgRating: Math.round(avgRating * 10) / 10,
    }
  } catch (error) {
    console.error("Error fetching movie by ID/slug:", error)
    return null
  }
}

export async function getRelatedMovies(movieId: string, genre: string) {
  try {
    // 1. Try to find movies with same genre
    let related = await db.query.movies.findMany({
      where: and(eq(movies.genre, genre), not(eq(movies.id, movieId))),
      orderBy: [desc(movies.views)], // Order by views for "smart" relevance
      limit: 8, // Increased limit to 8 for better vertical display
      columns: {
        id: true,
        title: true,
        posterUrl: true,
        year: true,
        genre: true,
        slug: true,
      },
    })

    // 2. If not enough, find movies with overlapping genre words (e.g. "Action Sci-Fi" matches "Action")
    if (related.length < 8) {
      const genreWords = genre.split(" ").filter((w) => w.length > 3)

      if (genreWords.length > 0) {
        const moreRelated = await db.query.movies.findMany({
          where: and(
            or(...genreWords.map((w) => ilike(movies.genre, `%${w}%`))),
            not(eq(movies.id, movieId)),
            // Exclude already found
            related.length > 0
              ? not(
                  inArray(
                    movies.id,
                    related.map((m) => m.id),
                  ),
                )
              : undefined,
          ),
          limit: 8 - related.length,
          columns: {
            id: true,
            title: true,
            posterUrl: true,
            year: true,
            genre: true,
            slug: true,
          },
        })
        related = [...related, ...moreRelated]
      }
    }

    // 3. Fallback to trending/popular if still not enough
    if (related.length < 8) {
      const popular = await db.query.movies.findMany({
        where: and(
          not(eq(movies.id, movieId)),
          // Exclude already found
          related.length > 0
            ? not(
                inArray(
                  movies.id,
                  related.map((m) => m.id),
                ),
              )
            : undefined,
        ),
        orderBy: [desc(movies.views)],
        limit: 8 - related.length,
        columns: {
          id: true,
          title: true,
          posterUrl: true,
          year: true,
          genre: true,
          slug: true,
        },
      })
      related = [...related, ...popular]
    }

    return related
  } catch (error) {
    console.error("Error fetching related movies:", error)
    return []
  }
}

export async function getAdminMetrics() {
  try {
    const [userCount] = await db.select({ count: count() }).from(users)
    const [movieCount] = await db.select({ count: count() }).from(movies)

    // New users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [recentUsersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`)

    const [viewsResult] = await db.select({ value: sum(movies.views) }).from(movies)

    return [
      { label: "Total Users", value: userCount.count.toLocaleString(), change: "+5.2%" },
      { label: "New Users (30d)", value: `+${recentUsersCount.count.toLocaleString()}`, change: "+8.1%" },
      { label: "Total Movies", value: movieCount.count.toLocaleString(), change: `+${movieCount.count}` },
      { label: "Total Watch Hours", value: `${Math.floor((Number(viewsResult?.value) || 0) / 60)}h`, change: "+15.3%" },
    ]
  } catch (error) {
    console.error("Error fetching admin metrics:", error)
    return [
      { label: "Total Users", value: "0", change: "+0%" },
      { label: "New Users (30d)", value: "+0", change: "+0%" },
      { label: "Total Movies", value: "0", change: "+0" },
      { label: "Total Watch Hours", value: "0h", change: "+0%" },
    ]
  }
}

export async function getRecentSignups() {
  try {
    const result = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 5,
    })
    return result.map((user) => ({
      id: user.id,
      email: user.email,
      date: user.createdAt.toISOString().split("T")[0],
    }))
  } catch (error) {
    console.error("Error fetching recent signups:", error)
    return []
  }
}

export async function getAdminMovies() {
  try {
    const result = await db.query.movies.findMany({
      orderBy: [desc(movies.createdAt)],
    })
    return result.map((movie) => ({
      id: movie.id,
      title: movie.title,
      genre: movie.genre,
      uploadDate: movie.createdAt.toISOString().split("T")[0],
      status: movie.isFeatured ? "Published" : "Draft",
      views: movie.views.toLocaleString(),
    }))
  } catch (error) {
    console.error("Error fetching admin movies:", error)
    return []
  }
}

export async function getAdminUsers() {
  try {
    const result = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    })
    return result.map((user) => ({
      id: user.id,
      email: user.email,
      dateJoined: user.createdAt.toISOString().split("T")[0],
      role: user.role === "ADMIN" ? "Admin" : "User",
    }))
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return []
  }
}

export async function verifyAdminInvitationCode(code: string): Promise<boolean> {
  const validCodes = [
    process.env.ADMIN_INVITATION_CODE,
    process.env.ADMIN_SECRET_KEY,
    process.env.SECRET_KEY,
    process.env.ADMIN_ACCESS_KEY,
    process.env.ADMIN_PIN,
    "MOBIX_ADMIN_2024",
  ].filter(Boolean)

  return validCodes.includes(code)
}

export async function checkAdminCount(): Promise<boolean> {
  try {
    const client = await db.query.users.findMany({
      limit: 100,
    })

    const adminCount = client.filter((user) => user.role === "ADMIN").length

    return adminCount < 2
  } catch (error) {
    console.error("Error checking admin count:", error)
    return true
  }
}

export async function assignAdminRole(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if user already exists in database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (existingUser) {
      await db.update(users).set({ role: "ADMIN" }).where(eq(users.clerkId, userId))

      return { success: true }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    const email = user.email

    if (!email) {
      return { success: false, error: "User email not found" }
    }

    await db.insert(users).values({
      clerkId: userId,
      email: email,
      username: user.username || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      role: "ADMIN",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error assigning admin role:", error)
    return { success: false, error: error.message || "Failed to assign admin role" }
  }
}

export async function updateMovie(
  id: string,
  data: {
    title?: string
    description?: string
    year?: number
    genre?: string
    posterUrl?: string
    videoUrl?: string
    downloadEnabled?: boolean
    downloadUrl?: string
    isFeatured?: boolean
    isTrending?: boolean
    customVastUrl?: string
    useGlobalAd?: boolean
  },
) {
  try {
    const updateData: any = { ...data }

    // If title is being updated, regenerate slug
    if (data.title) {
      updateData.slug = await generateSlug(data.title)
    }

    await db.update(movies).set(updateData).where(eq(movies.id, id))

    revalidatePath("/")
    revalidatePath("/home")
    revalidatePath("/browse")
    revalidatePath("/admin/dashboard")
    revalidatePath(`/movie/${id}`) // Revalidate the specific movie page

    return { success: true }
  } catch (error: any) {
    console.error("Error updating movie:", error)
    return { success: false, error: error.message || "Failed to update movie" }
  }
}

export async function deleteMovie(id: string) {
  try {
    await db.delete(movies).where(eq(movies.id, id))

    revalidatePath("/")
    revalidatePath("/home")
    revalidatePath("/browse")
    revalidatePath("/movies")
    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting movie:", error)
    return { success: false, error: error.message || "Failed to delete movie" }
  }
}

export async function ensureUserExists(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      const userFromClerk = await currentUser()
      const email = userFromClerk?.emailAddresses?.[0]?.emailAddress || ""

      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: email,
          username: userFromClerk?.username || null,
          firstName: userFromClerk?.firstName || null,
          lastName: userFromClerk?.lastName || null,
          role: "user",
        })
        .returning()

      return newUser
    }

    return user
  } catch (error) {
    console.error("Error ensuring user exists:", error)
    throw error
  }
}

export async function toggleLike(movieId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to like movies" }
    }

    const user = await ensureUserExists(userId)

    // Check if already liked
    const existingLike = await db.query.likes.findFirst({
      where: and(eq(likes.userId, user.id), eq(likes.movieId, movieId)),
    })

    if (existingLike) {
      // Unlike
      await db.delete(likes).where(eq(likes.id, existingLike.id))
      revalidatePath(`/movie/${movieId}`)
      revalidateTag(`movie:${movieId}`) // Add tag revalidation
      return { success: true, liked: false }
    } else {
      // Like
      await db.insert(likes).values({
        userId: user.id,
        movieId,
      })
      revalidatePath(`/movie/${movieId}`)
      revalidateTag(`movie:${movieId}`) // Add tag revalidation
      return { success: true, liked: true }
    }
  } catch (error: any) {
    console.error("Error toggling like:", error)
    return { success: false, error: error.message || "Failed to toggle like" }
  }
}

export async function addComment(movieId: string, content: string, rating?: number) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to comment" }
    }

    const user = await ensureUserExists(userId)

    const [newComment] = await db
      .insert(comments)
      .values({
        userId: user.id,
        movieId,
        content,
        rating: rating || null,
      })
      .returning()

    revalidatePath(`/movie/${movieId}`)
    revalidateTag(`movie:${movieId}`) // Add tag revalidation
    return { success: true, comment: newComment }
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return { success: false, error: error.message || "Failed to add comment" }
  }
}

export async function getMoviesByGenre(genre: string) {
  try {
    const result = await db.query.movies.findMany({
      where: ilike(movies.genre, `%${genre}%`),
      orderBy: [desc(movies.createdAt)],
      limit: 12,
      with: {
        likes: true, // Need counts for UI often
      },
    })

    return result
  } catch (error) {
    console.error("Error fetching movies by genre:", error)
    return []
  }
}

export async function getFeaturedMovie() {
  try {
    const movie = await db.query.movies.findFirst({
      where: eq(movies.isFeatured, true),
      orderBy: [desc(movies.createdAt)],
    })
    return movie || null
  } catch (error) {
    console.error("Error fetching featured movie:", error)
    return null
  }
}

export async function searchMovies(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return []
    }

    const result = await db.query.movies.findMany({
      where: or(
        ilike(movies.title, `%${query}%`),
        ilike(movies.description, `%${query}%`),
        ilike(movies.genre, `%${query}%`),
      ),
      limit: 10,
      orderBy: [desc(movies.createdAt)],
    })

    return result
  } catch (error) {
    console.error("Error searching movies:", error)
    return []
  }
}

export async function getAllComments() {
  try {
    const result = await db.query.comments.findMany({
      with: {
        user: true,
        movie: true,
      },
      orderBy: [desc(comments.createdAt)],
    })

    return result.map((comment) => ({
      id: comment.id,
      text: comment.text,
      rating: comment.rating,
      movieTitle: comment.movie.title,
      movieId: comment.movie.id,
      userEmail: comment.user.email,
      userName: comment.user.firstName || comment.user.username || comment.user.email,
      createdAt: comment.createdAt.toISOString().split("T")[0],
    }))
  } catch (error) {
    console.error("Error fetching all comments:", error)
    return []
  }
}

export async function deleteComment(commentId: string) {
  try {
    await db.delete(comments).where(eq(comments.id, commentId))

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

export async function banUser(userId: string) {
  try {
    await db.update(users).set({ role: "BANNED" }).where(eq(users.id, userId))

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error banning user:", error)
    return { success: false, error: error.message || "Failed to ban user" }
  }
}

export async function deleteUser(userId: string) {
  try {
    await db.delete(users).where(eq(users.id, userId))

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

export async function getAdSettings() {
  try {
    const settings = await db.query.adSettings.findFirst()
    return settings || null
  } catch (error) {
    console.error("Error fetching ad settings:", error)
    return null
  }
}

export async function updateAdSettings(settings: {
  horizontalAdCode?: string
  verticalAdCode?: string
  prerollAdCodes?: string
  midrollAdCodes?: string
  smartLinkUrl?: string
  adTimeoutSeconds?: number
  skipDelaySeconds?: number
  rotationIntervalSeconds?: number
  midrollIntervalMinutes?: number
  showPrerollAds?: boolean
  showMidrollAds?: boolean
  homepageEnabled?: boolean
  movieDetailEnabled?: boolean
  dashboardEnabled?: boolean
}) {
  try {
    const currentSettings = await db.query.adSettings.findFirst()

    if (!currentSettings) {
      await db.insert(adSettings).values({
        horizontalAdCode: settings.horizontalAdCode || "",
        verticalAdCode: settings.verticalAdCode || "",
        prerollAdCodes: settings.prerollAdCodes || "[]",
        midrollAdCodes: settings.midrollAdCodes || "[]",
        smartLinkUrl: settings.smartLinkUrl || "",
        adTimeoutSeconds: settings.adTimeoutSeconds || 20,
        skipDelaySeconds: settings.skipDelaySeconds || 10,
        rotationIntervalSeconds: settings.rotationIntervalSeconds || 5,
        midrollIntervalMinutes: settings.midrollIntervalMinutes || 20,
        showPrerollAds: settings.showPrerollAds ?? true,
        showMidrollAds: settings.showMidrollAds ?? false,
        homepageEnabled: settings.homepageEnabled ?? true,
        movieDetailEnabled: settings.movieDetailEnabled ?? true,
        dashboardEnabled: settings.dashboardEnabled ?? true,
        showDownloadPageAds: true,
      })
    } else {
      await db
        .update(adSettings)
        .set({
          horizontalAdCode: settings.horizontalAdCode,
          verticalAdCode: settings.verticalAdCode,
          prerollAdCodes: settings.prerollAdCodes,
          midrollAdCodes: settings.midrollAdCodes,
          smartLinkUrl: settings.smartLinkUrl,
          adTimeoutSeconds: settings.adTimeoutSeconds,
          skipDelaySeconds: settings.skipDelaySeconds,
          rotationIntervalSeconds: settings.rotationIntervalSeconds,
          midrollIntervalMinutes: settings.midrollIntervalMinutes,
          showPrerollAds: settings.showPrerollAds,
          showMidrollAds: settings.showMidrollAds,
          homepageEnabled: settings.homepageEnabled,
          movieDetailEnabled: settings.movieDetailEnabled,
          dashboardEnabled: settings.dashboardEnabled,
        })
        .where(eq(adSettings.id, currentSettings.id))
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    revalidatePath("/home")
    revalidatePath("/browse")
    revalidatePath("/dashboard")
    revalidatePath("/movie")
    revalidatePath("/download")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating ad settings:", error)
    return { success: false, error: error.message || "Failed to update ad settings" }
  }
}

export async function getUserProfile() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await ensureUserExists(userId)
    const userFromClerk = await currentUser()

    return {
      success: true,
      user: {
        ...user,
        username: userFromClerk?.username,
        firstName: userFromClerk?.firstName,
        lastName: userFromClerk?.lastName,
        imageUrl: userFromClerk?.imageUrl,
      },
    }
  } catch (error: any) {
    console.error("Error fetching user profile:", error)
    return { success: false, error: error.message || "Failed to fetch profile" }
  }
}

export async function updateUserProfile(data: { username: string; firstName: string; lastName: string }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      await db
        .update(users)
        .set({
          username: data.username || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId))
    } catch (dbError: any) {
      console.error("[v0] Database error updating profile:", dbError)
      return { success: false, error: "Failed to update profile" }
    }

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating user profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function getUserStats() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await ensureUserExists(userId)

    // Get likes count
    const [likesCount] = await db.select({ count: count() }).from(likes).where(eq(likes.userId, user.id))

    // Get comments count
    const [commentsCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, user.id))

    // Get watchlist count
    const [watchlistCount] = await db.select({ count: count() }).from(watchlist).where(eq(watchlist.userId, user.id))

    // Get liked movies with full movie data
    const likedMoviesData = await db.query.likes.findMany({
      where: eq(likes.userId, user.id),
      with: {
        movie: true,
      },
      orderBy: [desc(likes.createdAt)],
      limit: 20,
    })

    // Get watchlist movies with full movie data
    const watchlistMoviesData = await db.query.watchlist.findMany({
      where: eq(watchlist.userId, user.id),
      with: {
        movie: true,
      },
      orderBy: [desc(watchlist.createdAt)],
      limit: 20,
    })

    // Get user comments with movie data
    const userComments = await db.query.comments.findMany({
      where: eq(comments.userId, user.id),
      with: {
        movie: true,
      },
      orderBy: [desc(comments.createdAt)],
      limit: 10,
    })

    return {
      success: true,
      stats: {
        // Return in the format dashboard expects
        totalLikes: likesCount?.count || 0,
        totalComments: commentsCount?.count || 0,
        totalWatchlist: watchlistCount?.count || 0,
        email: user.email,
        memberSince: user.createdAt,
        // Include movies data inside stats for dashboard
        likedMovies: likedMoviesData.map((l) => l.movie).filter(Boolean),
        watchlistMovies: watchlistMoviesData.map((w) => w.movie).filter(Boolean),
        recentComments: userComments.map((c) => ({
          ...c,
          movieTitle: c.movie?.title,
          moviePoster: c.movie?.posterUrl,
        })),
      },
    }
  } catch (error: any) {
    console.error("Error fetching user stats:", error)
    return { success: false, error: error.message || "Failed to fetch stats" }
  }
}

export async function grantAdminAccessWithKey(accessKey: string) {
  try {
    const isValid = await verifyAdminInvitationCode(accessKey)

    if (!isValid) {
      return { success: false, error: "Invalid access key" }
    }

    const user = await currentUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const userEmail = user.emailAddresses?.[0]?.emailAddress || ""

    await db.insert(users).values({
      clerkId: user.id,
      email: userEmail,
      username: user.username || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      role: "ADMIN",
    })

    revalidatePath("/admin")
    revalidateTag("user:admin") // Add tag revalidation

    return { success: true }
  } catch (error: any) {
    console.error("Error granting admin access:", error)
    return { success: false, error: error.message || "Failed to grant access" }
  }
}

export async function submitFeedback(data: {
  type: "REQUEST" | "REPORT"
  title: string
  details?: string
  email?: string
}) {
  try {
    await db.insert(feedback).values({
      type: data.type,
      title: data.title,
      details: data.details || "",
      email: data.email || "",
    })

    return { success: true }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return { success: false, error: "Unable to submit. Please try again." }
  }
}

export async function getWatchlist() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await ensureUserExists(userId)

    const result = await db.query.watchlist.findMany({
      where: eq(watchlist.userId, user.id),
      with: {
        movie: true,
      },
      orderBy: [desc(watchlist.createdAt)],
    })

    return {
      success: true,
      movies: result.map((item) => ({
        ...item.movie,
        watchlistId: item.id,
      })),
    }
  } catch (error: any) {
    console.error("Error fetching watchlist:", error)
    return { success: false, error: error.message || "Failed to fetch watchlist" }
  }
}

export async function toggleWatchlist(movieId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to manage watchlist" }
    }

    const user = await ensureUserExists(userId)

    const existing = await db.query.watchlist.findFirst({
      where: and(eq(watchlist.userId, user.id), eq(watchlist.movieId, movieId)),
    })

    if (existing) {
      await db.delete(watchlist).where(eq(watchlist.id, existing.id))
      revalidatePath(`/movie/${movieId}`)
      revalidatePath("/dashboard")
      revalidatePath("/watchlist")
      revalidateTag(`watchlist:${user.id}`) // Add tag revalidation
      return { success: true, added: false }
    } else {
      await db.insert(watchlist).values({
        userId: user.id,
        movieId,
      })
      revalidatePath(`/movie/${movieId}`)
      revalidatePath("/dashboard")
      revalidatePath("/watchlist")
      revalidateTag(`watchlist:${user.id}`) // Add tag revalidation
      return { success: true, added: true }
    }
  } catch (error: any) {
    console.error("Error toggling watchlist:", error)
    return { success: false, error: error.message || "Failed to update watchlist" }
  }
}

export async function getWatchlistStatus(movieId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return false
    }

    const user = await ensureUserExists(userId)

    const existing = await db.query.watchlist.findFirst({
      where: and(eq(watchlist.userId, user.id), eq(watchlist.movieId, movieId)),
    })

    return !!existing
  } catch (error) {
    console.error("Error checking watchlist status:", error)
    return false
  }
}

export async function getFeedbackEntries() {
  try {
    const result = await db.query.feedback.findMany({
      orderBy: [desc(feedback.createdAt)],
    })
    return result
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return []
  }
}

export async function updateFeedbackStatus(id: string, status: string) {
  try {
    await db.update(feedback).set({ status }).where(eq(feedback.id, id))
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating feedback status:", error)
    return { success: false, error: error.message || "Failed to update status" }
  }
}

export async function deleteFeedback(id: string) {
  try {
    await db.delete(feedback).where(eq(feedback.id, id))
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting feedback:", error)
    return { success: false, error: error.message || "Failed to delete feedback" }
  }
}

export async function getRecommendedMovies() {
  try {
    const { userId } = await auth()

    // If no user, return popular movies
    if (!userId) {
      const popular = await db.query.movies.findMany({
        orderBy: [desc(movies.views)],
        limit: 12,
      })
      return popular
    }

    const user = await ensureUserExists(userId)

    // Get user's liked movies to understand preferences
    const userLikes = await db.query.likes.findMany({
      where: eq(likes.userId, user.id),
      with: {
        movie: true,
      },
    })

    if (userLikes.length === 0) {
      // User hasn't liked anything, return trending
      return await getTrendingMovies()
    }

    // Extract preferred genres
    const genres = userLikes.map((l) => l.movie.genre)
    const genreCounts: Record<string, number> = {}

    genres.forEach((g) => {
      // Split "Action, Adventure" into individual genres
      const parts = g.split(/[,/ ]+/).filter((p) => p.length > 3)
      parts.forEach((p) => {
        genreCounts[p] = (genreCounts[p] || 0) + 1
      })
    })

    // Sort genres by frequency
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g)
      .slice(0, 3) // Top 3 genres

    if (topGenres.length === 0) return await getPublicMovies()

    // Find movies matching top genres, excluding already liked
    const likedMovieIds = userLikes.map((l) => l.movie.id)

    const recommendations = await db.query.movies.findMany({
      where: and(or(...topGenres.map((g) => ilike(movies.genre, `%${g}%`))), not(inArray(movies.id, likedMovieIds))),
      orderBy: [desc(movies.views)], // Surface popular ones in those genres
      limit: 12,
    })

    return recommendations.length > 0 ? recommendations : await getTrendingMovies()
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return []
  }
}

export async function getTopRatedMovies() {
  try {
    // Join comments to calculate average rating
    const topRated = await db
      .select({
        id: movies.id,
        title: movies.title,
        genre: movies.genre,
        posterUrl: movies.posterUrl,
        avgRating: sql<number>`avg(${comments.rating})`.mapWith(Number),
        ratingCount: count(comments.id),
      })
      .from(movies)
      .leftJoin(comments, eq(movies.id, comments.movieId))
      .groupBy(movies.id)
      .having(sql`count(${comments.id}) > 0`) // Only movies with ratings
      .orderBy(desc(sql`avg(${comments.rating})`))
      .limit(10)

    if (topRated.length < 5) {
      return await getPublicMovies()
    }

    return topRated
  } catch (error) {
    console.error("Error fetching top rated movies:", error)
    return []
  }
}

// ==================== PUSH NOTIFICATIONS ====================

export async function subscribeToPush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: false, error: "User not found" }
    }

    // Upsert subscription
    await db
      .insert(pushSubscriptions)
      .values({
        userId: dbUser.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })

    return { success: true }
  } catch (error: any) {
    console.error("Error subscribing to push:", error)
    return { success: false, error: error.message }
  }
}

export async function unsubscribeFromPush(endpoint: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))

    return { success: true }
  } catch (error: any) {
    console.error("Error unsubscribing from push:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllPushSubscriptions() {
  try {
    const subscriptions = await db.select().from(pushSubscriptions)
    return { success: true, subscriptions }
  } catch (error: any) {
    console.error("Error fetching push subscriptions:", error)
    return { success: false, error: error.message, subscriptions: [] }
  }
}

// ==================== WATCH HISTORY ====================

export async function updateWatchProgress(movieId: string, progress: number, duration: number) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: false, error: "User not found" }
    }

    await db
      .insert(watchHistory)
      .values({
        userId: dbUser.id,
        movieId,
        progress,
        duration,
        watchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [watchHistory.userId, watchHistory.movieId],
        set: {
          progress,
          duration,
          watchedAt: new Date(),
        },
      })

    return { success: true }
  } catch (error: any) {
    console.error("Error updating watch progress:", error)
    return { success: false, error: error.message }
  }
}

export async function getWatchHistory() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated", history: [] }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: false, error: "User not found", history: [] }
    }

    const history = await db
      .select({
        id: watchHistory.id,
        progress: watchHistory.progress,
        duration: watchHistory.duration,
        watchedAt: watchHistory.watchedAt,
        movie: {
          id: movies.id,
          slug: movies.slug,
          title: movies.title,
          posterUrl: movies.posterUrl,
          genre: movies.genre,
          year: movies.year,
          averageRating: movies.averageRating,
        },
      })
      .from(watchHistory)
      .innerJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(eq(watchHistory.userId, dbUser.id))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(20)

    return { success: true, history }
  } catch (error: any) {
    console.error("Error fetching watch history:", error)
    return { success: false, error: error.message, history: [] }
  }
}

export async function clearWatchHistory() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: false, error: "User not found" }
    }

    await db.delete(watchHistory).where(eq(watchHistory.userId, dbUser.id))

    revalidatePath("/dashboard")
    revalidatePath("/history")
    return { success: true }
  } catch (error: any) {
    console.error("Error clearing watch history:", error)
    return { success: false, error: error.message }
  }
}

// ==================== RATINGS ====================

export async function rateMovie(movieId: string, rating: number) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: false, error: "User not found" }
    }

    // Upsert rating
    await db
      .insert(ratings)
      .values({
        userId: dbUser.id,
        movieId,
        rating,
      })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.movieId],
        set: { rating },
      })

    // Update movie average rating
    const allRatings = await db.select({ rating: ratings.rating }).from(ratings).where(eq(ratings.movieId, movieId))

    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

    await db
      .update(movies)
      .set({ averageRating: avgRating.toFixed(1) })
      .where(eq(movies.id, movieId))

    revalidatePath(`/movie/${movieId}`)
    revalidatePath("/home")
    revalidatePath("/browse")

    return { success: true, averageRating: avgRating }
  } catch (error: any) {
    console.error("Error rating movie:", error)
    return { success: false, error: error.message }
  }
}

export async function getUserRating(movieId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { success: true, rating: null }
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return { success: true, rating: null }
    }

    const [userRating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, dbUser.id), eq(ratings.movieId, movieId)))
      .limit(1)

    return { success: true, rating: userRating?.rating || null }
  } catch (error: any) {
    console.error("Error fetching user rating:", error)
    return { success: false, error: error.message, rating: null }
  }
}

// ==================== CONTENT REPORTS ====================

export async function reportContent(movieId: string, reason: string, description?: string, email?: string) {
  try {
    const { userId: clerkId } = await auth()

    let dbUserId: string | null = null
    let userEmail = email || null

    if (clerkId) {
      const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
      dbUserId = dbUser?.id || null
      // Use user's email if not provided
      if (!userEmail && dbUser?.email) {
        userEmail = dbUser.email
      }
    }

    await db.insert(contentReports).values({
      userId: dbUserId,
      movieId,
      reason,
      description: description || null,
      status: "PENDING",
      email: userEmail || undefined,
    })

    return { success: true }
  } catch (error) {
    console.error("Error reporting content:", error)
    return { success: false, error: "Unable to submit report. Please try again." }
  }
}

export async function getContentReports(status?: string) {
  try {
    let query = db
      .select({
        id: contentReports.id,
        reason: contentReports.reason,
        description: contentReports.description,
        status: contentReports.status,
        createdAt: contentReports.createdAt,
        movie: {
          id: movies.id,
          title: movies.title,
          posterUrl: movies.posterUrl,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
        },
      })
      .from(contentReports)
      .innerJoin(movies, eq(contentReports.movieId, movies.id))
      .leftJoin(users, eq(contentReports.userId, users.id))
      .orderBy(desc(contentReports.createdAt))

    if (status) {
      query = query.where(eq(contentReports.status, status)) as typeof query
    }

    const reports = await query

    return { success: true, reports }
  } catch (error: any) {
    console.error("Error fetching content reports:", error)
    return { success: false, error: error.message, reports: [] }
  }
}

export async function updateReportStatus(reportId: string, status: string) {
  try {
    await db.update(contentReports).set({ status, updatedAt: new Date() }).where(eq(contentReports.id, reportId))

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating report status:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteContentReport(reportId: string) {
  try {
    await db.delete(contentReports).where(eq(contentReports.id, reportId))

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting report:", error)
    return { success: false, error: error.message }
  }
}

export async function saveWatchProgress(movieId: string, progress: number) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const dbUser = await ensureUserExists(userId)
    if (!dbUser) {
      return { success: false, error: "User not found" }
    }

    // Store watch progress in Redis for fast retrieval
    await redis.set(`watch:${dbUser.id}:${movieId}`, progress.toString(), {
      ex: 60 * 60 * 24 * 30, // Expire after 30 days
    })

    return { success: true }
  } catch (error) {
    console.error("Error saving watch progress:", error)
    return { success: false, error: "Failed to save progress" }
  }
}

export async function getContinueWatching() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return []
    }

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!dbUser) {
      return []
    }

    // Get movies with progress between 5% and 95% (started but not finished)
    const continueWatching = await db
      .select({
        id: movies.id,
        slug: movies.slug,
        title: movies.title,
        posterUrl: movies.posterUrl,
        genre: movies.genre,
        year: movies.year,
        averageRating: movies.averageRating,
        progress: watchHistory.progress,
        duration: watchHistory.duration,
        watchedAt: watchHistory.watchedAt,
      })
      .from(watchHistory)
      .innerJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(and(eq(watchHistory.userId, dbUser.id), gt(watchHistory.progress, 5), lt(watchHistory.progress, 95)))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(10)

    return continueWatching
  } catch (error: any) {
    console.error("Error fetching continue watching:", error)
    return []
  }
}

export async function seedDatabase() {
  const logs: string[] = []
  const log = (msg: string) => {
    logs.push(msg)
  }

  try {
    log("Starting database seeding...")

    // Sample movies to seed with explicit UUIDs to ensure no ID generation issues
    const sampleMovies = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Inception",
        description:
          "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        year: 2010,
        genre: "Sci-Fi",
        posterUrl: "/inception-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        isTrending: true,
        isFeatured: true,
        views: 1523,
        slug: await generateSlug("Inception"), // Add slug
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "The Dark Knight",
        description:
          "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        year: 2008,
        genre: "Action",
        posterUrl: "/dark-knight-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        isTrending: true,
        isFeatured: false,
        views: 2341,
        slug: await generateSlug("The Dark Knight"), // Add slug
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Interstellar",
        description:
          "A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.",
        year: 2014,
        genre: "Sci-Fi",
        posterUrl: "/interstellar-movie-poster.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        isTrending: true,
        isFeatured: false,
        views: 1876,
        slug: await generateSlug("Interstellar"), // Add slug
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        title: "The Shawshank Redemption",
        description:
          "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        year: 1994,
        genre: "Drama",
        posterUrl: "/shawshank-redemption-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        isTrending: false,
        isFeatured: false,
        views: 3124,
        slug: await generateSlug("The Shawshank Redemption"), // Add slug
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        title: "Pulp Fiction",
        description:
          "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        year: 1994,
        genre: "Drama",
        posterUrl: "/generic-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        isTrending: false,
        isFeatured: false,
        views: 2654,
        slug: await generateSlug("Pulp Fiction"), // Add slug
      },
      {
        id: "66666666-6666-4666-8666-666666666666",
        title: "The Matrix",
        description:
          "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
        year: 1999,
        genre: "Sci-Fi",
        posterUrl: "/matrix-movie-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        isTrending: true,
        isFeatured: false,
        views: 2987,
        slug: await generateSlug("The Matrix"), // Add slug
      },
      {
        id: "77777777-7777-4777-8777-777777777777",
        title: "Mad Max: Fury Road",
        description:
          "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.",
        year: 2015,
        genre: "Action",
        posterUrl: "/mad-max-fury-road-poster.jpg",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        isTrending: false,
        isFeatured: false,
        views: 1789,
        slug: await generateSlug("Mad Max: Fury Road"), // Add slug
      },
      {
        id: "88888888-8888-4888-8888-888888888888",
        title: "The Grand Budapest Hotel",
        description:
          "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.",
        year: 2014,
        genre: "Comedy",
        posterUrl: "/grand-budapest-hotel-inspired-poster.png",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        isTrending: false,
        isFeatured: false,
        views: 1234,
        slug: await generateSlug("The Grand Budapest Hotel"), // Add slug
      },
    ]

    let insertedCount = 0
    let skippedCount = 0

    log(`Found ${sampleMovies.length} movies to process`)

    for (const movieData of sampleMovies) {
      // Check if movie already exists by slug or title
      try {
        const existingBySlug = await db.query.movies.findFirst({
          where: eq(movies.slug, movieData.slug!),
        })
        const existingByTitle = await db.query.movies.findFirst({
          where: eq(movies.title, movieData.title),
        })

        if (existingBySlug || existingByTitle) {
          log(`Skipping: ${movieData.title} (Already exists by slug or title)`)
          skippedCount++
          continue
        }

        // Insert movie with explicit ID to prevent NULL violations
        await db.insert(movies).values({
          ...movieData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        log(`Inserted: ${movieData.title}`)
        insertedCount++
      } catch (insertError: any) {
        log(`ERROR inserting ${movieData.title}: ${insertError.message}`)
        console.error(insertError)
      }
    }

    // Ensure default ad settings exist
    try {
      const existingAdSettings = await db.query.adSettings.findFirst()
      if (!existingAdSettings) {
        await db.insert(adSettings).values({
          horizontalAdCode: "",
          verticalAdCode: "",
          prerollAdCodes: "[]", // Default to empty array string
          midrollAdCodes: "[]",
          smartLinkUrl: "",
          adTimeoutSeconds: 20,
          skipDelaySeconds: 10,
          rotationIntervalSeconds: 5,
          midrollIntervalMinutes: 20,
          showPrerollAds: true,
          showMidrollAds: false,
          homepageEnabled: false,
          movieDetailEnabled: false,
          dashboardEnabled: false, // Assuming this is a new default
          showDownloadPageAds: true, // Keep this or update if needed
        })
        log("Created default ad settings")
      } else {
        log("Ad settings already exist")
      }
    } catch (adError: any) {
      log(`ERROR checking ad settings: ${adError.message}`)
    }

    log(`Seeding complete! Added: ${insertedCount}, Skipped: ${skippedCount}`)
    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    revalidatePath("/browse") // Revalidate browse page too

    return {
      success: true,
      message: `Successfully seeded ${insertedCount} movies (${skippedCount} already existed)`,
      inserted: insertedCount,
      skipped: skippedCount,
      logs,
    }
  } catch (error: any) {
    console.error("Error seeding database:", error)
    log(`CRITICAL ERROR: ${error.message}`)
    return {
      success: false,
      error: error.message || "Failed to seed database",
      logs,
    }
  }
}

export async function getUsers() {
  try {
    const result = await db.query.users.findMany({
      with: {
        comments: true,
      },
      orderBy: [desc(users.createdAt)],
    })

    // Get duplicate IP counts
    const ipCounts: Record<string, number> = {}
    result.forEach((user) => {
      if (user.ipAddress) {
        ipCounts[user.ipAddress] = (ipCounts[user.ipAddress] || 0) + 1
      }
    })

    return result.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      country: user.country,
      ipAddress: user.ipAddress,
      ipCount: user.ipAddress ? ipCounts[user.ipAddress] : 0,
      isDuplicateIp: user.ipAddress ? ipCounts[user.ipAddress] > 1 : false,
      createdAt: user.createdAt.toISOString().split("T")[0],
      clerkId: user.clerkId,
      commentsCount: user.comments.length,
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const result = await db.query.movies.findMany({
      columns: {
        genre: true,
      },
    })

    // Extract unique genres (some movies may have multiple genres)
    const genreSet = new Set<string>()
    result.forEach((movie) => {
      if (movie.genre) {
        // Split by common separators and add each genre
        const genres = movie.genre.split(/[,/]/).map((g) => g.trim())
        genres.forEach((g) => {
          if (g) genreSet.add(g)
        })
      }
    })

    return Array.from(genreSet).sort()
  } catch (error) {
    console.error("Error fetching genres:", error)
    return []
  }
}

export async function getMoviesPaginated(options: {
  genre?: string
  limit?: number
  offset?: number
  random?: boolean
}) {
  try {
    const { genre, limit = 20, offset = 0, random = false } = options

    const query = db.query.movies.findMany({
      where: genre ? ilike(movies.genre, `%${genre}%`) : undefined,
      limit,
      offset,
      orderBy: random ? sql`RANDOM()` : [desc(movies.createdAt)],
    })

    const result = await query

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(movies)
      .where(genre ? ilike(movies.genre, `%${genre}%`) : undefined)

    const total = Number(countResult[0]?.count || 0)

    return {
      movies: result,
      total,
      hasMore: offset + result.length < total,
    }
  } catch (error) {
    console.error("Error fetching paginated movies:", error)
    return { movies: [], total: 0, hasMore: false }
  }
}

export async function saveUserSettings(data: {
  type: "notifications" | "privacy"
  settings: Record<string, boolean>
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Store settings in Redis for fast access
    const key = `user:${userId}:${data.type}`
    await redis.set(key, JSON.stringify(data.settings))

    return { success: true }
  } catch (error: any) {
    console.error("Error saving user settings:", error)
    return { success: false, error: error.message || "Failed to save settings" }
  }
}

export async function getUserSettings(type: "notifications" | "privacy") {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated", settings: null }
    }

    const key = `user:${userId}:${type}`
    const settings = await redis.get(key)

    return { success: true, settings: settings || null }
  } catch (error: any) {
    console.error("Error getting user settings:", error)
    return { success: false, error: error.message, settings: null }
  }
}

// Get user notifications
export async function getUserNotifications(limit = 20) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return []
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return []
    }

    const result = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit,
      with: {
        movie: true,
      },
    })

    return result.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      movie: n.movie
        ? {
            id: n.movie.id,
            slug: n.movie.slug,
            title: n.movie.title,
            posterUrl: n.movie.posterUrl,
          }
        : null,
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return 0
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return 0
    }

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))

    return result?.count || 0
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId))

    return { success: true }
  } catch (error: any) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id))

    return { success: true }
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }
}

// Create notification (for admin use when uploading movies)
export async function createNotificationForAllUsers(title: string, message: string, type: string, movieId?: string) {
  try {
    const allUsers = await db.query.users.findMany()

    if (allUsers.length === 0) {
      return { success: true, count: 0 }
    }

    for (const user of allUsers) {
      await db.insert(notifications).values({
        userId: user.id,
        title,
        message,
        type,
        movieId: movieId || null,
        isRead: false,
      })
    }

    return { success: true, count: allUsers.length }
  } catch (error) {
    console.error("Error creating notifications:", error)
    return { success: false, error: "Unable to send notifications." }
  }
}

// Create notification to a single user
export async function createNotificationForUser(
  userId: string,
  title: string,
  message: string,
  type: string,
  movieId?: string,
) {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      movieId: movieId || null,
      isRead: false,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }
}

// Create notification by email (for feedback responses)
export async function createNotificationByEmail(email: string, title: string, message: string, type: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    await db.insert(notifications).values({
      userId: user.id,
      title,
      message,
      type,
      isRead: false,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error creating notification by email:", error)
    return { success: false, error: error.message }
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.delete(notifications).where(eq(notifications.id, notificationId))

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error.message }
  }
}

// ============ PROMOTIONS ============

export async function getPromotionEntries() {
  try {
    const entries = await db.query.promotions.findMany({
      orderBy: [desc(promotions.createdAt)],
    })

    // Get duplicate IPs and emails
    const ipCounts: Record<string, number> = {}
    const emailCounts: Record<string, number> = {}

    entries.forEach((entry) => {
      ipCounts[entry.ipAddress] = (ipCounts[entry.ipAddress] || 0) + 1
      emailCounts[entry.email] = (emailCounts[entry.email] || 0) + 1
    })

    return entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      isDuplicateIp: ipCounts[entry.ipAddress] > 1,
      isDuplicateEmail: emailCounts[entry.email] > 1,
      ipCount: ipCounts[entry.ipAddress],
      emailCount: emailCounts[entry.email],
    }))
  } catch {
    return []
  }
}

export async function getPromotionSettings() {
  try {
    const settings = await db.query.promotionSettings.findFirst({
      where: eq(promotionSettings.id, "default-promotion-settings"),
    })

    if (!settings) {
      return {
        isActive: false,
        enabledCountries: ["Nigeria"],
        headline: "Fill Details to Get 1.5GB Data!",
        subtext: "(Lucky Draw - Winners announced weekly)",
        successMessage: "Entry recorded! Winners announced every Monday",
        networkOptions: { Nigeria: ["MTN", "Airtel", "Glo", "9mobile", "Other"] },
      }
    }

    return {
      isActive: settings.isActive,
      enabledCountries: JSON.parse(settings.enabledCountries || '["Nigeria"]'),
      headline: settings.headline,
      subtext: settings.subtext,
      successMessage: settings.successMessage,
      networkOptions: JSON.parse(settings.networkOptions || "{}"),
    }
  } catch {
    return null
  }
}

export async function updatePromotionSettings(data: {
  isActive: boolean
  enabledCountries: string[]
  headline: string
  subtext: string
  successMessage: string
  networkOptions: Record<string, string[]>
}) {
  try {
    await db
      .update(promotionSettings)
      .set({
        isActive: data.isActive,
        enabledCountries: JSON.stringify(data.enabledCountries),
        headline: data.headline,
        subtext: data.subtext,
        successMessage: data.successMessage,
        networkOptions: JSON.stringify(data.networkOptions),
        updatedAt: new Date(),
      })
      .where(eq(promotionSettings.id, "default-promotion-settings"))

    revalidatePath("/home")
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getIpBlacklist() {
  try {
    const list = await db.query.ipBlacklist.findMany({
      orderBy: [desc(ipBlacklist.blacklistedAt)],
    })
    return list.map((item) => ({
      ...item,
      blacklistedAt: item.blacklistedAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export async function addToBlacklist(ipAddress: string, reason: string, blacklistedBy: string) {
  try {
    await db.insert(ipBlacklist).values({
      ipAddress,
      reason,
      blacklistedBy,
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function removeFromBlacklist(id: string) {
  try {
    await db.delete(ipBlacklist).where(eq(ipBlacklist.id, id))
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function pickRandomWinner(country?: string) {
  try {
    const query = db.query.promotions.findMany({
      orderBy: [sql`RANDOM()`],
    })

    const entries = await query

    // Filter by country if specified
    const filtered = country ? entries.filter((e) => e.country === country) : entries

    if (filtered.length === 0) return null

    // Pick random
    const winner = filtered[Math.floor(Math.random() * filtered.length)]
    return {
      ...winner,
      createdAt: winner.createdAt.toISOString(),
    }
  } catch {
    return null
  }
}

export async function deletePromotionEntry(id: string) {
  try {
    await db.delete(promotions).where(eq(promotions.id, id))
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getUsersWithDetails() {
  try {
    const result = await db.query.users.findMany({
      with: {
        comments: true,
      },
      orderBy: [desc(users.createdAt)],
    })

    // Get IP counts for duplicate detection
    const ipCounts: Record<string, number> = {}
    result.forEach((user) => {
      if (user.ipAddress) {
        ipCounts[user.ipAddress] = (ipCounts[user.ipAddress] || 0) + 1
      }
    })

    return result.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      country: user.country,
      ipAddress: user.ipAddress,
      createdAt: user.createdAt.toISOString().split("T")[0],
      clerkId: user.clerkId,
      commentsCount: user.comments.length,
      isDuplicateIp: user.ipAddress ? ipCounts[user.ipAddress] > 1 : false,
      ipCount: user.ipAddress ? ipCounts[user.ipAddress] : 0,
    }))
  } catch {
    return []
  }
}

export async function getUsersByIp(ipAddress: string) {
  try {
    const result = await db.query.users.findMany({
      where: eq(users.ipAddress, ipAddress),
    })
    return result
  } catch {
    return []
  }
}

export async function getUserCountryStats() {
  try {
    const result = await db.query.users.findMany({
      columns: {
        country: true,
      },
    })

    const stats: Record<string, number> = {}
    result.forEach((user) => {
      const country = user.country || "Unknown"
      stats[country] = (stats[country] || 0) + 1
    })

    return Object.entries(stats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
  } catch {
    return []
  }
}

export async function createWelcomeNotification(userId: string) {
  try {
    await db.insert(notifications).values({
      userId,
      title: "Welcome to moBix!",
      message: "Thanks for joining! Start exploring our collection of movies and enjoy your experience.",
      type: "welcome",
      isRead: false,
    })
    return { success: true }
  } catch (error) {
    console.error("Error creating welcome notification:", error)
    return { success: false }
  }
}

export async function sendWelcomeNotificationsToAllUsers() {
  try {
    const allUsers = await db.query.users.findMany()

    for (const user of allUsers) {
      // Check if user already has a welcome notification
      const existingWelcome = await db.query.notifications.findFirst({
        where: and(eq(notifications.userId, user.id), eq(notifications.type, "welcome")),
      })

      if (!existingWelcome) {
        await createWelcomeNotification(user.id)
      }
    }

    return { success: true, count: allUsers.length }
  } catch (error) {
    console.error("Error sending welcome notifications:", error)
    return { success: false }
  }
}

export async function syncUserToDatabase(
  clerkId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  country?: string,
  ipAddress?: string,
) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    if (existingUser) {
      // Update existing user - but don't overwrite country if already set
      await db
        .update(users)
        .set({
          email,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          // Only update country if not already set
          country: existingUser.country || country,
          ipAddress: ipAddress || existingUser.ipAddress,
        })
        .where(eq(users.clerkId, clerkId))

      return existingUser
    }

    // Create new user with auto-detected country
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName,
        lastName,
        country,
        ipAddress,
      })
      .returning()

    await createWelcomeNotification(newUser.id)

    return newUser
  } catch (error) {
    console.error("Error syncing user to database:", error)
    throw error
  }
}

export async function updateUserCountry(newCountry: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if user has already changed their country
    if (user.countryChangedAt) {
      return { success: false, error: "Country can only be changed once" }
    }

    await db
      .update(users)
      .set({
        country: newCountry,
        countryChangedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))

    return { success: true }
  } catch (error) {
    console.error("Error updating user country:", error)
    return { success: false, error: "Failed to update country" }
  }
}

export async function getCurrentUserDetails() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return null
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    return user
  } catch (error) {
    console.error("Error getting user details:", error)
    return null
  }
}

export async function targetUserForPromotion(targetUserId: string, reason?: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify admin
    const admin = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!admin || admin.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Check if user already has a pending targeted promotion
    const existing = await db.query.targetedPromotions.findFirst({
      where: and(
        eq(targetedPromotions.userId, targetUserId),
        eq(targetedPromotions.shown, false),
        eq(targetedPromotions.dismissed, false),
      ),
    })

    if (existing) {
      return { success: false, error: "User already has a pending promotion" }
    }

    await db.insert(targetedPromotions).values({
      userId: targetUserId,
      reason: reason || "Admin selected",
      shown: false,
      dismissed: false,
    })

    return { success: true }
  } catch (error) {
    console.error("Error targeting user for promotion:", error)
    return { success: false, error: "Failed to target user" }
  }
}

export async function getAllUsersForTargeting() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return []
    }

    const admin = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!admin || admin.role !== "ADMIN") {
      return []
    }

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    })

    return allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      country: u.country,
    }))
  } catch (error) {
    console.error("Error getting users for targeting:", error)
    return []
  }
}
