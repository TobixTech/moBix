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
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

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

    revalidatePath("/admin/dashboard")
    return { success: true, movie }
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
      take: 5,
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        views: "desc",
      },
    })
    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      views: movie.views.toLocaleString(),
    }))
  } catch (error) {
    console.error("[v0] Error fetching trending movies:", error)
    return []
  }
}

export async function getMovieById(id: string) {
  try {
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
      return null
    }

    // Calculate average rating
    const avgRating =
      movie.comments.length > 0
        ? movie.comments.reduce((acc, comment) => acc + comment.rating, 0) / movie.comments.length
        : 0

    return {
      ...movie,
      likesCount: movie._count.likes,
      avgRating: Math.round(avgRating * 10) / 10,
    }
  } catch (error) {
    console.error("[v0] Error fetching movie by ID:", error)
    return null
  }
}

export async function getRelatedMovies(movieId: string, genre: string) {
  try {
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

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "admin",
      },
    })

    // Also create user in database
    const { user: clerkUser } = await auth()
    if (clerkUser) {
      await prisma.user.upsert({
        where: { clerkId: userId },
        update: { role: "ADMIN" },
        create: {
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          role: "ADMIN",
        },
      })
    }

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
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

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
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.movie.delete({
      where: { id },
    })

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting movie:", error)
    return { success: false, error: error.message || "Failed to delete movie" }
  }
}

export async function toggleLike(movieId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Please sign in to like movies" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Create user if doesn't exist
      const { user: clerkUser } = await auth()
      if (!clerkUser) {
        return { success: false, error: "User not found" }
      }

      const newUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          role: "USER",
        },
      })

      // Create like
      await prisma.like.create({
        data: {
          userId: newUser.id,
          movieId,
        },
      })

      revalidatePath(`/movie/${movieId}`)
      return { success: true, liked: true }
    }

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
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      revalidatePath(`/movie/${movieId}`)
      return { success: true, liked: false }
    } else {
      // Like
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

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      const { user: clerkUser } = await auth()
      if (!clerkUser) {
        return { success: false, error: "User not found" }
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
          role: "USER",
        },
      })
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        movieId,
        text,
        rating,
      },
    })

    revalidatePath(`/movie/${movieId}`)
    return { success: true, comment }
  } catch (error: any) {
    console.error("[v0] Error adding comment:", error)
    return { success: false, error: error.message || "Failed to add comment" }
  }
}

export async function saveAdSettings(settings: {
  horizontalAdCode: string
  verticalAdCode: string
  homepageEnabled: boolean
  movieDetailEnabled: boolean
  dashboardEnabled: boolean
}) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get or create ad settings
    const existing = await prisma.adSettings.findFirst()

    if (existing) {
      await prisma.adSettings.update({
        where: { id: existing.id },
        data: settings,
      })
    } else {
      await prisma.adSettings.create({
        data: settings,
      })
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error saving ad settings:", error)
    return { success: false, error: error.message || "Failed to save ad settings" }
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
