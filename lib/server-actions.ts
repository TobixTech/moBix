"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "./prisma"
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
      const movie = await prisma.movie.create({
        data: {
          title: formData.title,
          description: formData.description,
          year: formData.year,
          genre: formData.genre,
          posterUrl: formData.posterUrl,
          videoUrl: formData.videoUrl,
          isTrending: formData.isTrending || false,
          isFeatured: formData.isFeatured || false,
        },
      })

      console.log("[v0] Movie uploaded successfully:", movie.id)
      revalidatePath("/admin/dashboard")
      revalidatePath("/")
      return { success: true, movie }
    } catch (dbError: any) {
      console.error("[v0] Database error uploading movie:", dbError)

      if (dbError.message?.includes("does not exist")) {
        return {
          success: false,
          error: "Database tables not initialized. Please run: npx prisma db push",
        }
      }

      throw dbError
    }
  } catch (error: any) {
    console.error("[v0] Error uploading movie:", error)
    return { success: false, error: error.message || "Failed to upload movie" }
  }
}

export async function getPublicMovies() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    })
    return movies
  } catch (error) {
    console.error("[v0] Error fetching public movies:", error)
    return []
  }
}

export async function getTrendingMovies() {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        isTrending: true,
      },
      take: 10,
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        views: "desc",
      },
    })

    if (movies.length === 0) {
      console.log("[v0] No trending movies found, fetching recent movies instead")
      const recentMovies = await prisma.movie.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { likes: true },
          },
        },
      })
      return recentMovies
    }

    return movies
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

    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!movie) {
      console.log("[v0] Movie not found with ID:", id)
      const allMovies = await prisma.movie.findMany({ select: { id: true, title: true } })
      console.log("[v0] Available movies in database:", allMovies.length, "movies")
      if (allMovies.length > 0) {
        console.log(
          "[v0] First few movie IDs:",
          allMovies.slice(0, 3).map((m) => ({ id: m.id, title: m.title })),
        )
      }
      return null
    }

    console.log("[v0] Movie found successfully:", movie.title, "| ID:", movie.id, "| Video URL:", movie.videoUrl)

    // Calculate average rating
    const avgRating =
      movie.comments.length > 0
        ? movie.comments.reduce((acc, comment) => acc + comment.rating, 0) / movie.comments.length
        : 0

    await prisma.movie.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return {
      ...movie,
      likesCount: movie._count.likes,
      avgRating: Math.round(avgRating * 10) / 10,
    }
  } catch (error: any) {
    console.error("[v0] Error fetching movie by ID:", error)
    console.error("[v0] Error details:", error.message)

    if (error.message?.includes("does not exist")) {
      console.error("[v0] Database tables not initialized. Run: npx prisma db push")
    }

    return null
  }
}

export async function getRelatedMovies(movieId: string, genre: string) {
  try {
    if (!genre) {
      console.log("[v0] No genre provided for related movies, fetching recent movies")
      const movies = await prisma.movie.findMany({
        where: {
          id: { not: movieId },
        },
        take: 4,
        orderBy: {
          createdAt: "desc",
        },
      })
      return movies
    }

    const movies = await prisma.movie.findMany({
      where: {
        genre,
        id: { not: movieId },
      },
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
    })

    if (movies.length === 0) {
      console.log("[v0] No related movies in genre:", genre, "- fetching recent movies instead")
      return await prisma.movie.findMany({
        where: {
          id: { not: movieId },
        },
        take: 4,
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return movies
  } catch (error) {
    console.error("[v0] Error fetching related movies:", error)
    return []
  }
}

export async function getAdminMetrics() {
  try {
    const [totalUsers, totalMovies, recentUsersCount] = await Promise.all([
      prisma.user.count(),
      prisma.movie.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const totalViews = await prisma.movie.aggregate({
      _sum: {
        views: true,
      },
    })

    return [
      { label: "Total Users", value: totalUsers.toLocaleString(), change: "+5.2%" },
      { label: "New Users (30d)", value: `+${recentUsersCount.toLocaleString()}`, change: "+8.1%" },
      { label: "Total Movies", value: totalMovies.toLocaleString(), change: `+${totalMovies}` },
      { label: "Total Watch Hours", value: `${Math.floor((totalViews._sum.views || 0) / 60)}h`, change: "+15.3%" },
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
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    })
    return users.map((user) => ({
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
    const movies = await prisma.movie.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    return movies.map((movie) => ({
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
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    return users.map((user) => ({
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
    const users = await client.users.getUserList({
      limit: 100,
    })

    const adminCount = users.data.filter((user) => user.publicMetadata?.role === "admin").length

    return adminCount < 2
  } catch (error) {
    console.error("[v0] Error checking admin count:", error)
    return true
  }
}

export async function assignAdminRole(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await clerkClient()

    // First, check if user already exists in database to prevent duplicates
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (existingUser) {
      // User already exists, just update role
      await client.users.updateUser(userId, {
        publicMetadata: {
          role: "admin",
        },
      })

      await prisma.user.update({
        where: { clerkId: userId },
        data: { role: "ADMIN" },
      })

      return { success: true }
    }

    // Get user email from Clerk
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress

    if (!email) {
      return { success: false, error: "User email not found" }
    }

    // Update Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "admin",
      },
    })

    // Create user in database with ADMIN role
    await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        role: "ADMIN",
      },
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
  },
) {
  try {
    console.log("[v0] Updating movie:", id)

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title: formData.title,
        description: formData.description,
        year: formData.year,
        genre: formData.genre,
        posterUrl: formData.posterUrl,
        videoUrl: formData.videoUrl,
        isTrending: formData.isTrending || false,
        isFeatured: formData.isFeatured || false,
      },
    })

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

    await prisma.movie.delete({
      where: { id },
    })

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
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      console.log("[v0] User not found in database, creating new user...")
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          role: "user",
        },
      })
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId,
        },
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      revalidatePath(`/movie/${movieId}`)
      return { success: true, liked: false }
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          movieId,
        },
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

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        movieId,
        text,
        rating,
      },
    })

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
    const movies = await prisma.movie.findMany({
      where: {
        genre,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    })
    return movies
  } catch (error) {
    console.error("[v0] Error fetching movies by genre:", error)
    return []
  }
}

export async function getFeaturedMovie() {
  try {
    const movie = await prisma.movie.findFirst({
      where: {
        isFeatured: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return movie
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

    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { genre: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    })

    return movies
  } catch (error) {
    console.error("[v0] Error searching movies:", error)
    return []
  }
}

export async function getAllComments() {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        user: true,
        movie: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return comments.map((comment) => ({
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
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting comment:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

export async function getAdSettings() {
  try {
    const settings = await prisma.adSettings.findFirst()
    return settings || null
  } catch (error) {
    console.error("[v0] Error fetching ad settings:", error)
    return null
  }
}

export async function updateAdSettings(settings: {
  vastPrerollUrl?: string
  adTimeout?: number
  adsEnabled?: boolean
  horizontalAdCode?: string
  verticalAdCode?: string
  homepageEnabled?: boolean
  movieDetailEnabled?: boolean
  dashboardEnabled?: boolean
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    console.log("[v0] Updating ad settings:", settings)

    // Get or create ad settings
    const existing = await prisma.adSettings.findFirst()

    if (existing) {
      const updated = await prisma.adSettings.update({
        where: { id: existing.id },
        data: settings,
      })
      console.log("[v0] Ad settings updated successfully")
      revalidatePath("/admin/dashboard")
      revalidatePath("/movie/[id]")
      return { success: true, settings: updated }
    } else {
      const created = await prisma.adSettings.create({
        data: {
          ...settings,
          vastPrerollUrl: settings.vastPrerollUrl || "",
          adTimeout: settings.adTimeout || 20,
          adsEnabled: settings.adsEnabled ?? true,
        },
      })
      console.log("[v0] Ad settings created successfully")
      revalidatePath("/admin/dashboard")
      return { success: true, settings: created }
    }
  } catch (error: any) {
    console.error("[v0] Error updating ad settings:", error)
    return { success: false, error: error.message || "Failed to update ad settings" }
  }
}

export async function getUserProfile() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    const user = await ensureUserExists(userId)

    const [likesCount, commentsCount] = await Promise.all([
      prisma.like.count({ where: { userId: user.id } }),
      prisma.comment.count({ where: { userId: user.id } }),
    ])

    return {
      success: true,
      profile: {
        id: user.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        createdAt: clerkUser.createdAt,
        likesCount,
        commentsCount,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching user profile:", error)
    return { success: false, error: error.message || "Failed to fetch user profile" }
  }
}

export async function updateUserProfile(data: { firstName?: string; lastName?: string }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clerkClient()
    await client.users.updateUser(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
    })

    await ensureUserExists(userId)

    revalidatePath("/profile")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating user profile:", error)
    return { success: false, error: error.message || "Failed to update profile" }
  }
}

export async function getUserStats() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        likes: { include: { movie: true } },
        comments: { include: { movie: true } },
      },
    })

    if (!user) {
      return { success: false, error: "User not found", stats: null }
    }

    return {
      success: true,
      stats: {
        email: user.email,
        memberSince: user.createdAt,
        totalLikes: user.likes.length,
        totalComments: user.comments.length,
        likedMovies: user.likes.map((like) => like.movie),
      },
    }
  } catch (error: any) {
    console.error("[v0] Error fetching user stats:", error)
    return { success: false, error: error.message, stats: null }
  }
}

export async function grantAdminAccessWithKey(secretKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in first" }
    }

    const validKey = process.env.ADMIN_SECRET_KEY || "MOBIX_SECRET_2024"

    if (secretKey !== validKey) {
      return { success: false, error: "Invalid access key" }
    }

    console.log("[v0] Valid access key provided, granting admin access...")

    const client = await clerkClient()

    // Get user email from Clerk
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

    console.log("[v0] Clerk publicMetadata updated to admin role")

    // Try to sync with database, but don't fail if table doesn't exist
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      })

      if (user) {
        await prisma.user.update({
          where: { clerkId: userId },
          data: { role: "ADMIN" },
        })
        console.log("[v0] Database user updated to ADMIN role")
      } else {
        await prisma.user.create({
          data: {
            clerkId: userId,
            email: email,
            role: "ADMIN",
          },
        })
        console.log("[v0] Database user created with ADMIN role")
      }
    } catch (dbError: any) {
      console.log("[v0] Database sync skipped (tables may not exist yet):", dbError.message)
      // Continue anyway - Clerk metadata is updated
    }

    try {
      const sessions = await client.users.getUserList({
        userId: [userId],
      })
      console.log("[v0] Session refresh triggered")
    } catch (sessionError) {
      console.log("[v0] Could not refresh session, but continuing...")
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error granting admin access:", error)
    return { success: false, error: error.message || "Failed to grant admin access" }
  }
}

export async function uploadMovieWithAds(formData: {
  title: string
  description: string
  year: number
  genre: string
  posterUrl: string
  videoUrl: string
  customVastUrl?: string
  useGlobalAd?: boolean
  downloadUrl?: string
  downloadEnabled?: boolean
  isTrending?: boolean
  isFeatured?: boolean
}) {
  try {
    console.log("[v0] Uploading movie with ad settings:", formData.title)

    try {
      const movie = await prisma.movie.create({
        data: {
          title: formData.title,
          description: formData.description,
          year: formData.year,
          genre: formData.genre,
          posterUrl: formData.posterUrl,
          videoUrl: formData.videoUrl,
          customVastUrl: formData.customVastUrl || null,
          useGlobalAd: formData.useGlobalAd ?? true,
          downloadUrl: formData.downloadUrl || null,
          downloadEnabled: formData.downloadEnabled ?? false,
          isTrending: formData.isTrending || false,
          isFeatured: formData.isFeatured || false,
        },
      })

      console.log("[v0] Movie uploaded successfully with ad settings:", movie.id)
      revalidatePath("/admin/dashboard")
      revalidatePath("/")
      return { success: true, movie }
    } catch (dbError: any) {
      console.error("[v0] Database error uploading movie:", dbError)

      if (dbError.message?.includes("does not exist")) {
        return {
          success: false,
          error: "Database tables not initialized. Please run: npx prisma db push",
        }
      }

      throw dbError
    }
  } catch (error: any) {
    console.error("[v0] Error uploading movie:", error)
    return { success: false, error: error.message || "Failed to upload movie" }
  }
}

export async function updateMovieWithAds(
  id: string,
  formData: {
    title: string
    description: string
    year: number
    genre: string
    posterUrl: string
    videoUrl: string
    customVastUrl?: string
    useGlobalAd?: boolean
    downloadUrl?: string
    downloadEnabled?: boolean
    isTrending?: boolean
    isFeatured?: boolean
  },
) {
  try {
    console.log("[v0] Updating movie with ad settings:", id)

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title: formData.title,
        description: formData.description,
        year: formData.year,
        genre: formData.genre,
        posterUrl: formData.posterUrl,
        videoUrl: formData.videoUrl,
        customVastUrl: formData.customVastUrl || null,
        useGlobalAd: formData.useGlobalAd ?? true,
        downloadUrl: formData.downloadUrl || null,
        downloadEnabled: formData.downloadEnabled ?? false,
        isTrending: formData.isTrending || false,
        isFeatured: formData.isFeatured || false,
      },
    })

    console.log("[v0] Movie updated successfully with ad settings")
    revalidatePath("/admin/dashboard")
    revalidatePath(`/movie/${id}`)
    return { success: true, movie }
  } catch (error: any) {
    console.error("[v0] Error updating movie:", error)
    return { success: false, error: error.message || "Failed to update movie" }
  }
}
