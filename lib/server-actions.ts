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

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error assigning admin role:", error)
    return { success: false, error: error.message || "Failed to assign admin role" }
  }
}
