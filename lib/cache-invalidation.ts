"use server"

import { redis, cacheKeys } from "./redis"

export async function invalidateMovieCache(movieId: string) {
  try {
    await redis.del(cacheKeys.movie(movieId))
    await redis.del(cacheKeys.relatedMovies(movieId))
    console.log("[Cache] Invalidated movie cache:", movieId)
  } catch (error) {
    console.error("[Cache] Error invalidating movie cache:", error)
  }
}

export async function invalidateMovieListCaches() {
  try {
    await Promise.all([
      redis.del(cacheKeys.publicMovies()),
      redis.del(cacheKeys.trendingMovies()),
      redis.del(cacheKeys.featuredMovie()),
    ])
    console.log("[Cache] Invalidated all movie list caches")
  } catch (error) {
    console.error("[Cache] Error invalidating movie list caches:", error)
  }
}

export async function invalidateGenreCache(genre: string) {
  try {
    await redis.del(cacheKeys.moviesByGenre(genre))
    console.log("[Cache] Invalidated genre cache:", genre)
  } catch (error) {
    console.error("[Cache] Error invalidating genre cache:", error)
  }
}

export async function invalidateSearchCache(query: string) {
  try {
    await redis.del(cacheKeys.searchMovies(query))
    console.log("[Cache] Invalidated search cache:", query)
  } catch (error) {
    console.error("[Cache] Error invalidating search cache:", error)
  }
}

export async function invalidateMetricsCache() {
  try {
    await redis.del(cacheKeys.metrics())
    console.log("[Cache] Invalidated metrics cache")
  } catch (error) {
    console.error("[Cache] Error invalidating metrics cache:", error)
  }
}

export async function invalidateAllCaches() {
  try {
    const keys = [
      cacheKeys.publicMovies(),
      cacheKeys.trendingMovies(),
      cacheKeys.featuredMovie(),
      cacheKeys.metrics(),
      cacheKeys.comments(),
      cacheKeys.users(),
    ]

    for (const key of keys) {
      await redis.del(key)
    }
    console.log("[Cache] Invalidated all caches")
  } catch (error) {
    console.error("[Cache] Error invalidating all caches:", error)
  }
}
