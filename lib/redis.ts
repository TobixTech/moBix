import { Redis } from "@upstash/redis"

export async function getRedisClient() {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL || process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN,
  })

  return redis
}
