import type { MetadataRoute } from "next"
import { getPublicMovies } from "@/lib/server-actions"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  // Dynamic movie pages
  let moviePages: MetadataRoute.Sitemap = []
  try {
    const movies = await getPublicMovies()
    moviePages = movies.map((movie) => ({
      url: `${baseUrl}/movie/${movie.id}`,
      lastModified: movie.updatedAt ? new Date(movie.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error("Error generating movie sitemap:", error)
  }

  return [...staticPages, ...moviePages]
}
