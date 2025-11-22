import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

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
