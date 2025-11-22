import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

export function getRedis(): Redis | null {
  // Skip Redis during build time if env vars are not available
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    } catch (error) {
      console.error("[v0] Failed to initialize Redis client:", error)
      return null
    }
  }

  return redisClient
}

export const redis = {
  getInstance: () => getRedis(),

  set: async (key: string, value: any, opts?: { ex?: number }) => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.set(key, value, opts)
    } catch (error) {
      console.error("[v0] Redis set error:", error)
      return null
    }
  },

  get: async (key: string) => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.get(key)
    } catch (error) {
      console.error("[v0] Redis get error:", error)
      return null
    }
  },

  del: async (...keys: string[]) => {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.del(...keys)
    } catch (error) {
      console.error("[v0] Redis del error:", error)
      return null
    }
  },
}

export const cacheKeys = {
  movie: (id: string) => `movie:${id}`,
  publicMovies: () => `movies:public`,
  trendingMovies: () => `movies:trending`,
  moviesByGenre: (genre: string) => `movies:genre:${genre.toLowerCase()}`,
  featuredMovie: () => `movie:featured`,
  metrics: () => `admin:metrics`,
  searchMovies: (query: string) => `search:${query.toLowerCase()}`,
  relatedMovies: (movieId: string) => `movies:related:${movieId}`,
  comments: () => `comments:all`,
  users: () => `users:all`,
}

export const cacheTTL = {
  movies: 3600, // 1 hour
  movieDetail: 1800, // 30 minutes
  trending: 1800, // 30 minutes
  search: 600, // 10 minutes
  metrics: 3600, // 1 hour
  featured: 3600, // 1 hour
  homepage: 60, // 1 minute for high-traffic home page
}
