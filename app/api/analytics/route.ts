import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { movies, users, series, watchHistory, likes, comments, seriesWatchHistory } from "@/lib/db/schema"
import { count, sum, desc, gte } from "drizzle-orm"

export async function GET() {
  try {
    // Get total views from movies
    const [movieViews] = await db.select({ total: sum(movies.views) }).from(movies)

    // Get total views from series
    const [seriesViews] = await db.select({ total: sum(series.views) }).from(series)

    const totalViews = (Number(movieViews?.total) || 0) + (Number(seriesViews?.total) || 0)

    // Get total users
    const [userCount] = await db.select({ count: count() }).from(users)

    // Get total movies
    const [movieCount] = await db.select({ count: count() }).from(movies)

    // Get total series
    const [seriesCount] = await db.select({ count: count() }).from(series)

    // Get total likes
    const [likeCount] = await db.select({ count: count() }).from(likes)

    // Get total comments
    const [commentCount] = await db.select({ count: count() }).from(comments)

    // Get new users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [newUsersWeek] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo))

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [newUsersMonth] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo))

    // Get watch history count (engagement metric)
    const [watchCount] = await db.select({ count: count() }).from(watchHistory)
    const [seriesWatchCount] = await db.select({ count: count() }).from(seriesWatchHistory)
    const totalWatches = (watchCount?.count || 0) + (seriesWatchCount?.count || 0)

    // Get top 5 trending movies
    const trendingMovies = await db
      .select({
        id: movies.id,
        title: movies.title,
        posterUrl: movies.posterUrl,
        views: movies.views,
      })
      .from(movies)
      .orderBy(desc(movies.views))
      .limit(5)

    // Get top 5 trending series
    const trendingSeries = await db
      .select({
        id: series.id,
        title: series.title,
        posterUrl: series.posterUrl,
        views: series.views,
      })
      .from(series)
      .orderBy(desc(series.views))
      .limit(5)

    // Get recent signups (last 10)
    const recentSignups = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10)

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        totalUsers: userCount?.count || 0,
        totalMovies: movieCount?.count || 0,
        totalSeries: seriesCount?.count || 0,
        totalLikes: likeCount?.count || 0,
        totalComments: commentCount?.count || 0,
        totalWatches,
        newUsersWeek: newUsersWeek?.count || 0,
        newUsersMonth: newUsersMonth?.count || 0,
        trendingMovies,
        trendingSeries,
        recentSignups,
      },
    })
  } catch (error: any) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch analytics" }, { status: 500 })
  }
}
