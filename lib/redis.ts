import { Redis } from "@upstash/redis"

// Singleton Redis client
let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return redisClient
}

// Cache key prefixes
export const CACHE_KEYS = {
  TRENDING_MOVIES: "movies:trending",
  FEATURED_MOVIE: "movies:featured",
  RECENT_MOVIES: "movies:recent",
  GENRE_MOVIES: (genre: string) => `movies:genre:${genre.toLowerCase()}`,
  ALL_GENRES: "movies:genres:all",
  MOVIE_DETAIL: (id: string) => `movie:${id}`,
  SEARCH_RESULTS: (query: string) => `search:${query.toLowerCase().trim()}`,
  AD_SETTINGS: "settings:ads",
  VIEW_COUNT: (movieId: string) => `views:${movieId}`,
  RATE_LIMIT: (ip: string, action: string) => `ratelimit:${action}:${ip}`,
} as const

// Cache TTL in seconds
export const CACHE_TTL = {
  TRENDING: 300, // 5 minutes
  FEATURED: 300, // 5 minutes
  RECENT: 180, // 3 minutes
  GENRE: 300, // 5 minutes
  GENRES_LIST: 600, // 10 minutes
  MOVIE_DETAIL: 600, // 10 minutes
  SEARCH: 120, // 2 minutes
  AD_SETTINGS: 300, // 5 minutes
  VIEW_COUNT: 60, // 1 minute (flush to DB frequently)
} as const

// Generic cache get with type safety
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const data = await redis.get<T>(key)
    return data
  } catch (error) {
    console.error(`[Redis] Cache get error for ${key}:`, error)
    return null
  }
}

// Generic cache set with TTL
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.set(key, value, { ex: ttlSeconds })
  } catch (error) {
    console.error(`[Redis] Cache set error for ${key}:`, error)
  }
}

// Delete cache key
export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(key)
  } catch (error) {
    console.error(`[Redis] Cache delete error for ${key}:`, error)
  }
}

// Delete multiple cache keys by pattern
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error(`[Redis] Cache delete pattern error for ${pattern}:`, error)
  }
}

// Increment view count in Redis (fast, batched to DB later)
export async function incrementViewCount(movieId: string): Promise<number> {
  try {
    const redis = getRedisClient()
    const key = CACHE_KEYS.VIEW_COUNT(movieId)
    const count = await redis.incr(key)
    // Set expiry if this is a new key
    if (count === 1) {
      await redis.expire(key, CACHE_TTL.VIEW_COUNT * 10) // 10 minutes before auto-expire
    }
    return count
  } catch (error) {
    console.error(`[Redis] Increment view count error for ${movieId}:`, error)
    return 0
  }
}

// Get view count from Redis
export async function getViewCount(movieId: string): Promise<number> {
  try {
    const redis = getRedisClient()
    const count = await redis.get<number>(CACHE_KEYS.VIEW_COUNT(movieId))
    return count || 0
  } catch (error) {
    console.error(`[Redis] Get view count error for ${movieId}:`, error)
    return 0
  }
}

// Flush view counts to database (call periodically)
export async function flushViewCountsToDb(): Promise<{ movieId: string; count: number }[]> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys("views:*")
    const results: { movieId: string; count: number }[] = []

    for (const key of keys) {
      const movieId = key.replace("views:", "")
      const count = await redis.getdel<number>(key) // Get and delete atomically
      if (count && count > 0) {
        results.push({ movieId, count })
      }
    }

    return results
  } catch (error) {
    console.error("[Redis] Flush view counts error:", error)
    return []
  }
}

// Rate limiting
export async function checkRateLimit(
  ip: string,
  action: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  try {
    const redis = getRedisClient()
    const key = CACHE_KEYS.RATE_LIMIT(ip, action)

    const current = await redis.incr(key)

    // Set expiry on first request
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    }
  } catch (error) {
    console.error(`[Redis] Rate limit check error for ${ip}:${action}:`, error)
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds }
  }
}

// Invalidate all movie-related caches (call when movies are added/updated/deleted)
export async function invalidateMovieCaches(): Promise<void> {
  try {
    await Promise.all([
      cacheDelete(CACHE_KEYS.TRENDING_MOVIES),
      cacheDelete(CACHE_KEYS.FEATURED_MOVIE),
      cacheDelete(CACHE_KEYS.RECENT_MOVIES),
      cacheDelete(CACHE_KEYS.ALL_GENRES),
      cacheDeletePattern("movies:genre:*"),
      cacheDeletePattern("movie:*"),
      cacheDeletePattern("search:*"),
    ])
  } catch (error) {
    console.error("[Redis] Invalidate movie caches error:", error)
  }
}

// Invalidate ad settings cache
export async function invalidateAdSettingsCache(): Promise<void> {
  try {
    await cacheDelete(CACHE_KEYS.AD_SETTINGS)
  } catch (error) {
    console.error("[Redis] Invalidate ad settings cache error:", error)
  }
}
