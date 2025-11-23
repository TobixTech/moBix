"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "./db"
import { movies, users, likes, comments, adSettings, feedback, watchlist } from "./db/schema"
import { eq, desc, and, or, ilike, count, sum, sql, not, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

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

export async function uploadMovie(formData: {
  title: string
  description: string
  year: number
  genre: string
  posterUrl: string
  videoUrl: string
  isTrending?: boolean
  isFeatured?: boolean
}) {
  try {
    console.log("[v0] Uploading movie:", formData.title)

    try {
      const [movie] = await db
        .insert(movies)
        .values({
          title: formData.title,
          description: formData.description,
          year: formData.year,
          genre: formData.genre,
          posterUrl: formData.posterUrl,
          videoUrl: formData.videoUrl,
          isTrending: formData.isTrending || false,
          isFeatured: formData.isFeatured || false,
        })
        .returning()

      console.log("[v0] Movie uploaded successfully:", movie.id)
      revalidatePath("/admin/dashboard")
      revalidatePath("/")
      return { success: true, movie }
    } catch (dbError: any) {
      console.error("[v0] Database error uploading movie:", dbError)
      throw dbError
    }
  } catch (error: any) {
    console.error("[v0] Error uploading movie:", error)
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
    console.error("[v0] Error fetching public movies:", error)
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
    console.error("[v0] Error fetching trending movies:", error)
    return []
  }
}

export async function getMovieById(id: string) {
  try {
    console.log("[v0] Fetching movie by ID:", id)

    if (!id || id.trim() === "") {
      console.log("[v0] Invalid movie ID provided")
      return null
    }

    const movie = await db.query.movies.findFirst({
      where: eq(movies.id, id),
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
      console.log("[v0] Movie not found with ID:", id)
      return null
    }

    console.log("[v0] Movie found successfully:", movie.title, "| ID:", movie.id)

    // Calculate average rating
    const avgRating =
      movie.comments.length > 0
        ? movie.comments.reduce((acc, comment) => acc + comment.rating, 0) / movie.comments.length
        : 0

    // Increment views
    await db
      .update(movies)
      .set({ views: sql`${movies.views} + 1` })
      .where(eq(movies.id, id))

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
  } catch (error: any) {
    console.error("[v0] Error fetching movie by ID:", error)
    return null
  }
}

export async function getRelatedMovies(movieId: string, genre: string) {
  try {
    // 1. Try to find movies with same genre
    let related = await db.query.movies.findMany({
      where: and(eq(movies.genre, genre), not(eq(movies.id, movieId))),
      orderBy: [desc(movies.views)], // Order by views for "smart" relevance
      limit: 4,
    })

    // 2. If not enough, find movies with overlapping genre words (e.g. "Action Sci-Fi" matches "Action")
    if (related.length < 4) {
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
          limit: 4 - related.length,
        })
        related = [...related, ...moreRelated]
      }
    }

    // 3. Fallback to trending/popular if still not enough
    if (related.length < 4) {
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
        limit: 4 - related.length,
      })
      related = [...related, ...popular]
    }

    return related
  } catch (error) {
    console.error("[v0] Error fetching related movies:", error)
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
    console.error("[v0] Error fetching admin metrics:", error)
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
    console.error("[v0] Error fetching recent signups:", error)
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
    console.error("[v0] Error fetching admin movies:", error)
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
    console.error("[v0] Error fetching admin users:", error)
    return []
  }
}

export async function verifyAdminInvitationCode(code: string): Promise<boolean> {
  const validCode = process.env.ADMIN_INVITATION_CODE || "MOBIX_ADMIN_2024"
  return code === validCode
}

export async function checkAdminCount(): Promise<boolean> {
  try {
    const client = await clerkClient()
    const usersList = await client.users.getUserList({
      limit: 100,
    })

    const adminCount = usersList.data.filter((user) => user.publicMetadata?.role === "admin").length

    return adminCount < 2
  } catch (error) {
    console.error("[v0] Error checking admin count:", error)
    return true
  }
}

export async function assignAdminRole(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clerkClient()

    // First, check if user already exists in database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (existingUser) {
      await client.users.updateUser(userId, {
        publicMetadata: {
          role: "admin",
        },
      })

      await db.update(users).set({ role: "ADMIN" }).where(eq(users.clerkId, userId))

      return { success: true }
    }

    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress

    if (!email) {
      return { success: false, error: "User email not found" }
    }

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "admin",
      },
    })

    await db.insert(users).values({
      clerkId: userId,
      email: email,
      username: clerkUser.username || null,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      role: "ADMIN",
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error assigning admin role:", error)
    return { success: false, error: error.message || "Failed to assign admin role" }
  }
}

export async function updateMovie(
  id: string,
  formData: {
    title: string
    description: string
    year: number
    genre: string
    posterUrl: string
    videoUrl: string
    isTrending?: boolean
    isFeatured?: boolean
    downloadEnabled?: boolean
    downloadUrl?: string
    customVastUrl?: string
    useGlobalAd?: boolean
  },
) {
  try {
    console.log("[v0] Updating movie:", id, formData)

    const [movie] = await db
      .update(movies)
      .set({
        title: formData.title,
        description: formData.description,
        year: formData.year,
        genre: formData.genre,
        posterUrl: formData.posterUrl,
        videoUrl: formData.videoUrl,
        isTrending: formData.isTrending || false,
        isFeatured: formData.isFeatured || false,
        downloadEnabled: formData.downloadEnabled || false,
        downloadUrl: formData.downloadUrl || "",
        customVastUrl: formData.customVastUrl || "",
        useGlobalAd: formData.useGlobalAd ?? true,
      })
      .where(eq(movies.id, id))
      .returning()

    console.log("[v0] Movie updated successfully")
    revalidatePath("/admin/dashboard")
    revalidatePath(`/movie/${id}`)
    return { success: true, movie }
  } catch (error: any) {
    console.error("[v0] Error updating movie:", error)
    return { success: false, error: error.message || "Failed to update movie" }
  }
}

export async function deleteMovie(id: string) {
  try {
    console.log("[v0] Deleting movie:", id)

    await db.delete(movies).where(eq(movies.id, id))

    console.log("[v0] Movie deleted successfully")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting movie:", error)
    return { success: false, error: error.message || "Failed to delete movie" }
  }
}

export async function ensureUserExists(userId: string) {
  try {
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      console.log("[v0] User not found in database, creating new user...")
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          username: clerkUser.username || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          role: "user",
        })
        .returning()

      user = newUser
      console.log("[v0] Created new user:", user.id)
    }

    return user
  } catch (error: any) {
    console.error("[v0] Error ensuring user exists:", error)
    throw error
  }
}

export async function toggleLike(movieId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to like movies" }
    }

    console.log("[v0] Toggle like for movie:", movieId, "user:", userId)

    const user = await ensureUserExists(userId)

    const existingLike = await db.query.likes.findFirst({
      where: and(eq(likes.userId, user.id), eq(likes.movieId, movieId)),
    })

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id))
      revalidatePath(`/movie/${movieId}`)
      revalidatePath("/dashboard")
      return { success: true, liked: false }
    } else {
      await db.insert(likes).values({
        userId: user.id,
        movieId,
      })
      revalidatePath(`/movie/${movieId}`)
      revalidatePath("/dashboard")
      return { success: true, liked: true }
    }
  } catch (error: any) {
    console.error("[v0] Error toggling like:", error)
    return { success: false, error: error.message || "Failed to toggle like" }
  }
}

export async function addComment(movieId: string, text: string, rating: number) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to comment" }
    }

    console.log("[v0] Adding comment for movie:", movieId, "user:", userId)

    const user = await ensureUserExists(userId)

    const [comment] = await db
      .insert(comments)
      .values({
        userId: user.id,
        movieId,
        text,
        rating,
      })
      .returning()

    console.log("[v0] Comment created:", comment.id)
    revalidatePath(`/movie/${movieId}`)
    return { success: true, comment }
  } catch (error: any) {
    console.error("[v0] Error adding comment:", error)
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

    console.log(`[v0] Found ${result.length} movies for genre: ${genre}`)
    return result
  } catch (error) {
    console.error("[v0] Error fetching movies by genre:", error)
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
    console.error("[v0] Error fetching featured movie:", error)
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
    console.error("[v0] Error searching movies:", error)
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
    console.error("[v0] Error fetching all comments:", error)
    return []
  }
}

export async function deleteComment(commentId: string) {
  try {
    console.log("[v0] Deleting comment:", commentId)

    await db.delete(comments).where(eq(comments.id, commentId))

    console.log("[v0] Comment deleted successfully")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting comment:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

export async function banUser(userId: string) {
  try {
    console.log("[v0] Banning user:", userId)

    await db.update(users).set({ role: "BANNED" }).where(eq(users.id, userId))

    console.log("[v0] User banned successfully")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error banning user:", error)
    return { success: false, error: error.message || "Failed to ban user" }
  }
}

export async function deleteUser(userId: string) {
  try {
    console.log("[v0] Deleting user:", userId)

    await db.delete(users).where(eq(users.id, userId))

    console.log("[v0] User deleted successfully")
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting user:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

export async function getAdSettings() {
  try {
    const settings = await db.query.adSettings.findFirst()
    return settings || null
  } catch (error) {
    console.error("[v0] Error fetching ad settings:", error)
    return null
  }
}

export async function updateAdSettings(settings: {
  horizontalAdCode?: string
  verticalAdCode?: string
  vastUrl?: string
  smartLinkUrl?: string
  adTimeoutSeconds?: number
  showPrerollAds?: boolean
  homepageEnabled?: boolean
  movieDetailEnabled?: boolean
}) {
  try {
    console.log("[v0] Updating ad settings:", settings)

    const currentSettings = await db.query.adSettings.findFirst()

    if (!currentSettings) {
      await db.insert(adSettings).values({
        horizontalAdCode: settings.horizontalAdCode || "",
        verticalAdCode: settings.verticalAdCode || "",
        vastUrl: settings.vastUrl || "",
        smartLinkUrl: settings.smartLinkUrl || "",
        adTimeoutSeconds: settings.adTimeoutSeconds || 20,
        showPrerollAds: settings.showPrerollAds ?? true,
        homepageEnabled: settings.homepageEnabled ?? true,
        movieDetailEnabled: settings.movieDetailEnabled ?? true,
        showDownloadPageAds: true,
      })
    } else {
      await db
        .update(adSettings)
        .set({
          horizontalAdCode: settings.horizontalAdCode,
          verticalAdCode: settings.verticalAdCode,
          vastUrl: settings.vastUrl,
          smartLinkUrl: settings.smartLinkUrl,
          adTimeoutSeconds: settings.adTimeoutSeconds,
          showPrerollAds: settings.showPrerollAds,
          homepageEnabled: settings.homepageEnabled,
          movieDetailEnabled: settings.movieDetailEnabled,
        })
        .where(eq(adSettings.id, currentSettings.id))
    }

    console.log("[v0] Ad settings updated successfully")
    revalidatePath("/admin/dashboard")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating ad settings:", error)
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
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    return {
      success: true,
      user: {
        ...user,
        username: clerkUser.username,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching user profile:", error)
    return { success: false, error: error.message || "Failed to fetch profile" }
  }
}

export async function updateUserProfile(data: { username: string; firstName: string; lastName: string }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const client = await clerkClient()

    try {
      await client.users.updateUser(userId, {
        username: data.username || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      })

      await db
        .update(users)
        .set({
          username: data.username || undefined,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
        })
        .where(eq(users.clerkId, userId))
    } catch (clerkError: any) {
      // Handle case where username might be taken or other Clerk validation errors
      console.error("[v0] Clerk update error:", clerkError)
      return { success: false, error: clerkError.errors?.[0]?.message || "Failed to update profile in Clerk" }
    }

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating user profile:", error)
    return { success: false, error: error.message || "Failed to update profile" }
  }
}

export async function getUserStats(userId: string) {
  try {
    // We need to find our internal DB user ID first (which corresponds to the Clerk ID)
    // But our schema stores clerkId in users.clerkId and referenced by users.id in other tables.
    // Wait, the likes/comments tables use our internal UUID (users.id), NOT the clerk ID.

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return { likesCount: 0, commentsCount: 0 }
    }

    const [likesCount] = await db.select({ count: count() }).from(likes).where(eq(likes.userId, user.id))
    const [commentsCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, user.id))

    return {
      likesCount: likesCount.count,
      commentsCount: commentsCount.count,
    }
  } catch (error) {
    console.error("[v0] Error fetching user stats:", error)
    return { likesCount: 0, commentsCount: 0 }
  }
}

export async function grantAdminAccessWithKey(accessKey: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const isValid = await verifyAdminInvitationCode(accessKey)

    if (!isValid) {
      return { success: false, error: "Invalid access key" }
    }

    const result = await assignAdminRole(userId)

    if (result.success) {
      revalidatePath("/admin")
      revalidatePath("/profile")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Error granting admin access:", error)
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
    console.log("[v0] Submitting feedback:", data)

    await db.insert(feedback).values({
      type: data.type,
      title: data.title,
      details: data.details || "",
      email: data.email || "",
    })

    console.log("[v0] Feedback submitted successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error submitting feedback:", error)
    return { success: false, error: error.message || "Failed to submit feedback" }
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
    console.error("[v0] Error fetching watchlist:", error)
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
      return { success: true, added: false }
    } else {
      await db.insert(watchlist).values({
        userId: user.id,
        movieId,
      })
      revalidatePath(`/movie/${movieId}`)
      revalidatePath("/dashboard")
      revalidatePath("/watchlist")
      return { success: true, added: true }
    }
  } catch (error: any) {
    console.error("[v0] Error toggling watchlist:", error)
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
    console.error("[v0] Error checking watchlist status:", error)
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
    console.error("[v0] Error fetching feedback:", error)
    return []
  }
}

export async function updateFeedbackStatus(id: string, status: string) {
  try {
    await db.update(feedback).set({ status }).where(eq(feedback.id, id))
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating feedback status:", error)
    return { success: false, error: error.message || "Failed to update status" }
  }
}

export async function deleteFeedback(id: string) {
  try {
    await db.delete(feedback).where(eq(feedback.id, id))
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting feedback:", error)
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

    if (topGenres.length === 0) return await getTrendingMovies()

    // Find movies matching top genres, excluding already liked
    const likedMovieIds = userLikes.map((l) => l.movie.id)

    const recommendations = await db.query.movies.findMany({
      where: and(or(...topGenres.map((g) => ilike(movies.genre, `%${g}%`))), not(inArray(movies.id, likedMovieIds))),
      orderBy: [desc(movies.views)], // Surface popular ones in those genres
      limit: 12,
    })

    return recommendations.length > 0 ? recommendations : await getTrendingMovies()
  } catch (error) {
    console.error("[v0] Error fetching recommendations:", error)
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
    console.error("[v0] Error fetching top rated movies:", error)
    return []
  }
}
