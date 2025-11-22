import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

export function getRedis(): Redis | null {
  // Skip Redis during build time if env vars are not available
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn("[v0] Redis environment variables not available, skipping cache")
    return null
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }

  return redisClient
}

// Export a getter function instead of direct instance
export const redis = {
  get: () => getRedis(),
  set: async (key: string, value: any, opts?: { ex?: number }) => {
    const client = getRedis()
    if (!client) return null
    return client.set(key, value, opts)
  },
  get: async (key: string) => {
    const client = getRedis()
    if (!client) return null
    return client.get(key)
  },
  del: async (...keys: string[]) => {
    const client = getRedis()
    if (!client) return null
    return client.del(...keys)
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
