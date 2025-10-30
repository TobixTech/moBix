"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getAdminMetrics() {
  return [
    { label: "Total Users", value: "1.2M", change: "+5.2%" },
    { label: "New Users (30d)", value: "+12,450", change: "+8.1%" },
    { label: "Total Movies", value: "4,500", change: "+120" },
    { label: "Total Watch Hours", value: "9,870h", change: "+15.3%" },
  ]
}

export async function uploadMovie(formData: {
  title: string
  description: string
  genre: string
  posterUrl: string
  videoUrl: string
  year: number
  isTrending?: boolean
  isFeatured?: boolean
}) {
  try {
    const movie = await prisma.movie.create({
      data: {
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        posterUrl: formData.posterUrl,
        videoUrl: formData.videoUrl,
        year: formData.year,
        isTrending: formData.isTrending || false,
        isFeatured: formData.isFeatured || false,
      },
    })
    return { success: true, movieId: movie.id }
  } catch (error) {
    console.error("[v0] Error uploading movie:", error)
    throw new Error("Failed to upload movie")
  }
}

export async function getTrendingMovies() {
  try {
    const movies = await prisma.movie.findMany({
      where: { isTrending: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    })
    return movies.map((m) => ({ id: m.id, title: m.title, views: "0" }))
  } catch (error) {
    console.error("[v0] Error fetching trending movies:", error)
    return []
  }
}

export async function getRecentSignups() {
  return [
    { id: 1, email: "user1@example.com", date: "2024-01-20" },
    { id: 2, email: "user2@example.com", date: "2024-01-19" },
    { id: 3, email: "user3@example.com", date: "2024-01-18" },
    { id: 4, email: "user4@example.com", date: "2024-01-17" },
    { id: 5, email: "user5@example.com", date: "2024-01-16" },
  ]
}

export async function getAdminMovies() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: "desc" },
    })
    return movies.map((m) => ({
      id: m.id,
      title: m.title,
      genre: m.genre,
      uploadDate: m.createdAt.toISOString().split("T")[0],
      status: m.isFeatured ? "Published" : "Draft",
      views: "0",
    }))
  } catch (error) {
    console.error("[v0] Error fetching admin movies:", error)
    return []
  }
}

export async function getAdminUsers() {
  return [
    { id: 1, email: "admin@example.com", dateJoined: "2023-06-15", role: "Admin" },
    { id: 2, email: "user1@example.com", dateJoined: "2024-01-10", role: "User" },
    { id: 3, email: "user2@example.com", dateJoined: "2024-01-12", role: "User" },
    { id: 4, email: "user3@example.com", dateJoined: "2024-01-15", role: "User" },
    { id: 5, email: "user4@example.com", dateJoined: "2024-01-18", role: "User" },
  ]
}

export async function getPublicMovies() {
  try {
    const movies = await prisma.movie.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
    })
    return movies.map((m) => ({ id: m.id, title: m.title, rating: 8.5 }))
  } catch (error) {
    console.error("[v0] Error fetching public movies:", error)
    return []
  }
}

export async function getMovieById(id: string) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id },
    })
    return movie
  } catch (error) {
    console.error("[v0] Error fetching movie:", error)
    return null
  }
}

export async function getRelatedMovies(genre: string, excludeId: string, limit = 4) {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        genre: genre,
        NOT: { id: excludeId },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    })
    return movies
  } catch (error) {
    console.error("[v0] Error fetching related movies:", error)
    return []
  }
}

export async function verifyAdminInvitationCode(code: string): Promise<boolean> {
  // TODO: Replace with real database query to validate invitation code
  // For now, only accept the hardcoded code
  return code === "MOBIX_ADMIN_2024"
}

export async function checkAdminCount(): Promise<boolean> {
  // TODO: Replace with real database query to count existing admins
  // For now, always return true (will be replaced with database check)
  // This should check if admin count < 2
  return true
}

export async function assignAdminRole(userId: string): Promise<void> {
  try {
    const client = await clerkClient()

    // Update user with admin role in public metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "admin",
      },
    })

    console.log("[v0] Admin role assigned to user:", userId)
  } catch (err: any) {
    console.log("[v0] Error assigning admin role:", err)
    throw new Error("Failed to assign admin role")
  }
}
