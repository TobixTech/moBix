"use server"

// These will be replaced with real database calls

export async function getAdminMetrics() {
  // TODO: Replace with real database query
  return [
    { label: "Total Users", value: "1.2M", change: "+5.2%" },
    { label: "New Users (30d)", value: "+12,450", change: "+8.1%" },
    { label: "Total Movies", value: "4,500", change: "+120" },
    { label: "Total Watch Hours", value: "9,870h", change: "+15.3%" },
  ]
}

export async function getTrendingMovies() {
  // TODO: Replace with real database query
  return [
    { id: 1, title: "The Last Horizon", views: "245.8K" },
    { id: 2, title: "Cosmic Adventure", views: "198.3K" },
    { id: 3, title: "Silent Echo", views: "156.2K" },
    { id: 4, title: "Neon Dreams", views: "142.5K" },
    { id: 5, title: "Digital Frontier", views: "128.9K" },
  ]
}

export async function getRecentSignups() {
  // TODO: Replace with real database query
  return [
    { id: 1, email: "user1@example.com", date: "2024-01-20" },
    { id: 2, email: "user2@example.com", date: "2024-01-19" },
    { id: 3, email: "user3@example.com", date: "2024-01-18" },
    { id: 4, email: "user4@example.com", date: "2024-01-17" },
    { id: 5, email: "user5@example.com", date: "2024-01-16" },
  ]
}

export async function getAdminMovies() {
  // TODO: Replace with real database query
  return [
    {
      id: 1,
      title: "The Last Horizon",
      genre: "Sci-Fi",
      uploadDate: "2024-01-15",
      status: "Published",
      views: "245.8K",
    },
    {
      id: 2,
      title: "Cosmic Adventure",
      genre: "Action",
      uploadDate: "2024-01-10",
      status: "Published",
      views: "198.3K",
    },
    { id: 3, title: "Silent Echo", genre: "Drama", uploadDate: "2024-01-05", status: "Draft", views: "0" },
    { id: 4, title: "Neon Dreams", genre: "Thriller", uploadDate: "2024-01-01", status: "Published", views: "142.5K" },
  ]
}

export async function getAdminUsers() {
  // TODO: Replace with real database query
  return [
    { id: 1, email: "admin@example.com", dateJoined: "2023-06-15", role: "Admin" },
    { id: 2, email: "user1@example.com", dateJoined: "2024-01-10", role: "User" },
    { id: 3, email: "user2@example.com", dateJoined: "2024-01-12", role: "User" },
    { id: 4, email: "user3@example.com", dateJoined: "2024-01-15", role: "User" },
    { id: 5, email: "user4@example.com", dateJoined: "2024-01-18", role: "User" },
  ]
}

export async function getPublicMovies() {
  // TODO: Replace with real database query
  return [
    { id: 1, title: "Cosmic Adventure", rating: 8.5 },
    { id: 2, title: "Silent Echo", rating: 7.8 },
    { id: 3, title: "Neon Dreams", rating: 8.2 },
    { id: 4, title: "Lost Kingdom", rating: 7.9 },
    { id: 5, title: "Time Paradox", rating: 8.7 },
    { id: 6, title: "Ocean Depths", rating: 7.6 },
  ]
}

export async function verifyAdminInvitationCode(code: string): Promise<boolean> {
  // TODO: Replace with real database query
  return code === "MOBIX_ADMIN_2024"
}
