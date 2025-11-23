"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "./db"
import { movies, users, likes, comments, adSettings } from "./db/schema"
import { eq, desc, and, or, ilike, count, sum, sql, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"

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
    // Fetch all movies first (matching previous logic for random shuffle)
    // To get like counts, we'll fetch them separately or use a join if needed.
    // For simplicity and to match the 'shuffle' logic, we'll fetch movies and their like counts.

    // Efficient approach: Get top movies by likes, or just random ones?
    // The previous code fetched ALL movies, counted likes, then shuffled.

    const allMovies = await db.query.movies.findMany({
      with: {
        likes: true, // This fetches all likes. For large datasets, use count() instead.
      },
    })

    if (allMovies.length === 0) {
      console.log("[v0] No movies found in database")
      return []
    }

    // Randomize the movies array
    const shuffled = allMovies.sort(() => 0.5 - Math.random())

    // Take the first 10 random movies
    const randomMovies = shuffled.slice(0, 10)

    console.log(`[v0] Returning ${randomMovies.length} random movies for trending`)
    return randomMovies
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

    return {
      ...movie,
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
    if (!genre) {
      console.log("[v0] No genre provided for related movies, fetching recent movies")
      const result = await db.query.movies.findMany({
        where: not(eq(movies.id, movieId)),
        orderBy: [desc(movies.createdAt)],
        limit: 4,
      })
      return result
    }

    const result = await db.query.movies.findMany({
      where: and(eq(movies.genre, genre), not(eq(movies.id, movieId))),
      orderBy: [desc(movies.createdAt)],
      limit: 4,
    })

    if (result.length === 0) {
      console.log("[v0] No related movies in genre:", genre, "- fetching recent movies instead")
      return await db.query.movies.findMany({
        where: not(eq(movies.id, movieId)),
        orderBy: [desc(movies.createdAt)],
        limit: 4,
      })
    }

    return result
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
      return { success: true, liked: false }
    } else {
      await db.insert(likes).values({
        userId: user.id,
        movieId,
      })
      revalidatePath(`/movie/${movieId}`)
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
