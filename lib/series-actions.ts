"use server"

import { db } from "@/lib/db"
import {
  series,
  seasons,
  episodes,
  seriesWatchlist,
  seriesWatchHistory,
  seriesRatings,
  seriesLikes,
  seriesComments,
  users,
  seriesReports,
} from "@/lib/db/schema"
import { eq, desc, and, sql, ilike, or } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function toggleSeriesLike(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    const existing = await db
      .select()
      .from(seriesLikes)
      .where(and(eq(seriesLikes.userId, user[0].id), eq(seriesLikes.seriesId, seriesId)))
      .limit(1)

    if (existing[0]) {
      // Unlike - remove from likes
      await db.delete(seriesLikes).where(and(eq(seriesLikes.userId, user[0].id), eq(seriesLikes.seriesId, seriesId)))

      // Get new count
      const newCount = await getSeriesLikesCount(seriesId)
      return { success: true, liked: false, likesCount: newCount }
    } else {
      // Like - add to likes
      await db.insert(seriesLikes).values({ userId: user[0].id, seriesId }).onConflictDoNothing()

      // Get new count
      const newCount = await getSeriesLikesCount(seriesId)
      return { success: true, liked: true, likesCount: newCount }
    }
  } catch (error) {
    console.error("Error toggling series like:", error)
    return { success: false, error: "Failed to toggle like" }
  }
}

export async function hasUserLikedSeries(seriesId: string): Promise<boolean> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return false

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return false

    const existing = await db
      .select()
      .from(seriesLikes)
      .where(and(eq(seriesLikes.userId, user[0].id), eq(seriesLikes.seriesId, seriesId)))
      .limit(1)

    return !!existing[0]
  } catch {
    return false
  }
}

export async function getSeriesLikesCount(seriesId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(seriesLikes)
      .where(eq(seriesLikes.seriesId, seriesId))

    return result[0]?.count || 0
  } catch {
    return 0
  }
}

export async function getAllSeries(options?: {
  genre?: string
  sort?: string
  search?: string
  limit?: number
}) {
  try {
    let query = db.select().from(series).$dynamic()

    const conditions = []

    if (options?.genre) {
      conditions.push(ilike(series.genre, `%${options.genre}%`))
    }

    if (options?.search) {
      conditions.push(or(ilike(series.title, `%${options.search}%`), ilike(series.description, `%${options.search}%`)))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    switch (options?.sort) {
      case "oldest":
        query = query.orderBy(series.releaseYear)
        break
      case "rating":
        query = query.orderBy(desc(series.averageRating))
        break
      case "views":
        query = query.orderBy(desc(series.views))
        break
      case "a-z":
        query = query.orderBy(series.title)
        break
      case "z-a":
        query = query.orderBy(desc(series.title))
        break
      default:
        query = query.orderBy(desc(series.createdAt))
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    return await query
  } catch (error) {
    console.error("Error fetching series:", error)
    return []
  }
}

export async function getSeriesGenres() {
  try {
    const allSeries = await db.select({ genre: series.genre }).from(series)
    const genres = new Set<string>()

    allSeries.forEach((s) => {
      s.genre.split(",").forEach((g) => genres.add(g.trim()))
    })

    return Array.from(genres).sort()
  } catch (error) {
    console.error("Error fetching genres:", error)
    return []
  }
}

export async function getSeriesWithSeasons(idOrSlug: string) {
  try {
    let seriesData = await db.select().from(series).where(eq(series.id, idOrSlug)).limit(1)

    if (!seriesData[0]) {
      seriesData = await db.select().from(series).where(eq(series.slug, idOrSlug)).limit(1)
    }

    if (!seriesData[0]) return null

    const seasonsData = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seriesId, seriesData[0].id))
      .orderBy(seasons.seasonNumber)

    const seasonsWithEpisodes = await Promise.all(
      seasonsData.map(async (season) => {
        const episodesData = await db
          .select()
          .from(episodes)
          .where(eq(episodes.seasonId, season.id))
          .orderBy(episodes.episodeNumber)

        return { ...season, episodes: episodesData }
      }),
    )

    const commentsData = await db
      .select({
        id: seriesComments.id,
        text: seriesComments.text,
        rating: seriesComments.rating,
        createdAt: seriesComments.createdAt,
        user: {
          email: users.email,
          firstName: users.firstName,
        },
      })
      .from(seriesComments)
      .innerJoin(users, eq(seriesComments.userId, users.id))
      .where(eq(seriesComments.seriesId, seriesData[0].id))
      .orderBy(desc(seriesComments.createdAt))
      .limit(50)

    const likesCount = await getSeriesLikesCount(seriesData[0].id)

    await db
      .update(series)
      .set({ views: sql`${series.views} + 1` })
      .where(eq(series.id, seriesData[0].id))

    return {
      ...seriesData[0],
      likesCount,
      seasons: seasonsWithEpisodes,
      comments: commentsData.map((c) => ({
        ...c,
        user: {
          ...c.user,
          displayName: c.user.firstName || c.user.email.split("@")[0],
        },
      })),
    }
  } catch (error) {
    console.error("Error fetching series with seasons:", error)
    return null
  }
}

export async function addToSeriesWatchlist(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db.insert(seriesWatchlist).values({ userId: user[0].id, seriesId }).onConflictDoNothing()
    return { success: true }
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return { success: false, error: "Failed to add to watchlist" }
  }
}

export async function removeFromSeriesWatchlist(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db
      .delete(seriesWatchlist)
      .where(and(eq(seriesWatchlist.userId, user[0].id), eq(seriesWatchlist.seriesId, seriesId)))
    return { success: true }
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    return { success: false, error: "Failed to remove from watchlist" }
  }
}

export async function isSeriesInWatchlist(seriesId: string): Promise<boolean> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return false

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return false

    const existing = await db
      .select()
      .from(seriesWatchlist)
      .where(and(eq(seriesWatchlist.userId, user[0].id), eq(seriesWatchlist.seriesId, seriesId)))
      .limit(1)

    return !!existing[0]
  } catch {
    return false
  }
}

export async function rateSeriesAction(seriesId: string, rating: number) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db
      .insert(seriesRatings)
      .values({ userId: user[0].id, seriesId, rating })
      .onConflictDoUpdate({
        target: [seriesRatings.userId, seriesRatings.seriesId],
        set: { rating },
      })

    const avgResult = await db
      .select({ avg: sql<number>`AVG(${seriesRatings.rating})` })
      .from(seriesRatings)
      .where(eq(seriesRatings.seriesId, seriesId))

    await db
      .update(series)
      .set({ averageRating: String(avgResult[0]?.avg || 0) })
      .where(eq(series.id, seriesId))

    return { success: true }
  } catch (error) {
    console.error("Error rating series:", error)
    return { success: false, error: "Failed to rate series" }
  }
}

export async function addSeriesComment(seriesId: string, text: string, rating: number) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    const [newComment] = await db
      .insert(seriesComments)
      .values({ userId: user[0].id, seriesId, text, rating })
      .returning()

    return {
      success: true,
      comment: {
        id: newComment.id,
        text: newComment.text,
        rating: newComment.rating,
        createdAt: newComment.createdAt,
        user: {
          email: user[0].email,
          firstName: user[0].firstName,
          displayName: user[0].firstName || user[0].email.split("@")[0],
        },
      },
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function addSeriesToWatchLater(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    const seriesData = await db.select().from(series).where(eq(series.id, seriesId)).limit(1)
    if (!seriesData[0]) return { success: false, error: "Series not found" }

    const firstSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seriesId, seriesId))
      .orderBy(seasons.seasonNumber)
      .limit(1)

    if (!firstSeason[0]) return { success: false, error: "No seasons found" }

    const firstEpisode = await db
      .select()
      .from(episodes)
      .where(eq(episodes.seasonId, firstSeason[0].id))
      .orderBy(episodes.episodeNumber)
      .limit(1)

    if (!firstEpisode[0]) return { success: false, error: "No episodes found" }

    await db
      .insert(seriesWatchHistory)
      .values({
        userId: user[0].id,
        seriesId,
        episodeId: firstEpisode[0].id,
        progress: 1,
        duration: firstEpisode[0].duration || 0,
      })
      .onConflictDoNothing()

    return { success: true }
  } catch (error) {
    console.error("Error adding to watch later:", error)
    return { success: false, error: "Failed to save for later" }
  }
}

export async function getAdminSeries() {
  try {
    const allSeries = await db.select().from(series).orderBy(desc(series.createdAt))

    const seriesWithDetails = await Promise.all(
      allSeries.map(async (s) => {
        const seasonsData = await db
          .select()
          .from(seasons)
          .where(eq(seasons.seriesId, s.id))
          .orderBy(seasons.seasonNumber)

        const seasonsWithEpisodes = await Promise.all(
          seasonsData.map(async (season) => {
            const episodesData = await db
              .select()
              .from(episodes)
              .where(eq(episodes.seasonId, season.id))
              .orderBy(episodes.episodeNumber)

            return { ...season, episodes: episodesData }
          }),
        )

        return { ...s, seasons: seasonsWithEpisodes }
      }),
    )

    return seriesWithDetails
  } catch (error) {
    console.error("Error fetching admin series:", error)
    return []
  }
}

export async function createSeries(data: {
  title: string
  description: string
  posterUrl: string
  bannerUrl?: string
  genre: string
  releaseYear: number
  status?: string
}) {
  try {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const [newSeries] = await db
      .insert(series)
      .values({
        ...data,
        slug,
        status: data.status || "ongoing",
      })
      .returning()

    return { success: true, series: newSeries }
  } catch (error) {
    console.error("Error creating series:", error)
    return { success: false, error: "Failed to create series" }
  }
}

export async function updateSeries(
  id: string,
  data: {
    title?: string
    description?: string
    posterUrl?: string
    bannerUrl?: string
    genre?: string
    releaseYear?: number
    status?: string
  },
) {
  try {
    const updateData: Record<string, unknown> = { ...data }
    if (data.title) {
      updateData.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    }

    await db.update(series).set(updateData).where(eq(series.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating series:", error)
    return { success: false, error: "Failed to update series" }
  }
}

export async function deleteSeries(id: string) {
  try {
    await db.delete(series).where(eq(series.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error deleting series:", error)
    return { success: false, error: "Failed to delete series" }
  }
}

export async function createSeason(data: {
  seriesId: string
  seasonNumber: number
  title?: string
  description?: string
  releaseYear?: number
}) {
  try {
    const [newSeason] = await db.insert(seasons).values(data).returning()

    await db
      .update(series)
      .set({ totalSeasons: sql`${series.totalSeasons} + 1` })
      .where(eq(series.id, data.seriesId))

    return { success: true, season: newSeason }
  } catch (error) {
    console.error("Error creating season:", error)
    return { success: false, error: "Failed to create season" }
  }
}

export async function updateSeason(
  id: string,
  data: {
    seasonNumber?: number
    title?: string
    description?: string
    releaseYear?: number
  },
) {
  try {
    await db.update(seasons).set(data).where(eq(seasons.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating season:", error)
    return { success: false, error: "Failed to update season" }
  }
}

export async function deleteSeason(id: string) {
  try {
    const season = await db.select().from(seasons).where(eq(seasons.id, id)).limit(1)
    if (season[0]) {
      await db.delete(seasons).where(eq(seasons.id, id))

      await db
        .update(series)
        .set({ totalSeasons: sql`GREATEST(${series.totalSeasons} - 1, 0)` })
        .where(eq(series.id, season[0].seriesId))
    }
    return { success: true }
  } catch (error) {
    console.error("Error deleting season:", error)
    return { success: false, error: "Failed to delete season" }
  }
}

export async function createEpisode(data: {
  seasonId: string
  episodeNumber: number
  title: string
  description?: string
  duration?: number
  thumbnailUrl?: string
  videoUrl: string
}) {
  try {
    const [newEpisode] = await db.insert(episodes).values(data).returning()

    const season = await db.select().from(seasons).where(eq(seasons.id, data.seasonId)).limit(1)
    if (season[0]) {
      await db
        .update(seasons)
        .set({ totalEpisodes: sql`${seasons.totalEpisodes} + 1` })
        .where(eq(seasons.id, data.seasonId))

      await db
        .update(series)
        .set({ totalEpisodes: sql`${series.totalEpisodes} + 1` })
        .where(eq(series.id, season[0].seriesId))
    }

    return { success: true, episode: newEpisode }
  } catch (error) {
    console.error("Error creating episode:", error)
    return { success: false, error: "Failed to create episode" }
  }
}

export async function updateEpisode(
  id: string,
  data: {
    episodeNumber?: number
    title?: string
    description?: string
    duration?: number
    thumbnailUrl?: string
    videoUrl?: string
  },
) {
  try {
    await db.update(episodes).set(data).where(eq(episodes.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating episode:", error)
    return { success: false, error: "Failed to update episode" }
  }
}

export async function deleteEpisode(id: string) {
  try {
    const episode = await db.select().from(episodes).where(eq(episodes.id, id)).limit(1)
    if (episode[0]) {
      await db.delete(episodes).where(eq(episodes.id, id))

      const season = await db.select().from(seasons).where(eq(seasons.id, episode[0].seasonId)).limit(1)
      if (season[0]) {
        await db
          .update(seasons)
          .set({ totalEpisodes: sql`GREATEST(${seasons.totalEpisodes} - 1, 0)` })
          .where(eq(seasons.id, episode[0].seasonId))

        await db
          .update(series)
          .set({ totalEpisodes: sql`GREATEST(${series.totalEpisodes} - 1, 0)` })
          .where(eq(series.id, season[0].seriesId))
      }
    }
    return { success: true }
  } catch (error) {
    console.error("Error deleting episode:", error)
    return { success: false, error: "Failed to delete episode" }
  }
}

export async function getTrendingSeries(limit = 10) {
  try {
    const result = await db.select().from(series).orderBy(desc(series.views)).limit(limit)

    return result
  } catch (error) {
    console.error("Error fetching trending series:", error)
    return []
  }
}

export async function getRecentSeries(limit = 10) {
  try {
    const result = await db.select().from(series).orderBy(desc(series.createdAt)).limit(limit)

    return result
  } catch (error) {
    console.error("Error fetching recent series:", error)
    return []
  }
}

export async function reportSeries(seriesId: string, reason: string, description?: string) {
  try {
    const { userId: clerkId } = await auth()
    let userId = null
    let userEmail = null

    if (clerkId) {
      const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
      if (user[0]) {
        userId = user[0].id
        userEmail = user[0].email
      }
    }

    await db.insert(seriesReports).values({
      userId,
      seriesId,
      reason,
      description,
      email: userEmail,
    })

    return { success: true }
  } catch (error) {
    console.error("Error reporting series:", error)
    return { success: false, error: "Failed to submit report" }
  }
}

export async function getSeriesReports() {
  try {
    const reports = await db.query.seriesReports.findMany({
      with: {
        user: true,
        series: true,
      },
      orderBy: [desc(seriesReports.createdAt)],
    })

    return reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      series: {
        id: report.series.id,
        title: report.series.title,
        posterUrl: report.series.posterUrl,
      },
      user: report.user
        ? {
            email: report.user.email,
            firstName: report.user.firstName,
          }
        : null,
      email: report.email,
      createdAt: report.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching series reports:", error)
    return []
  }
}

export async function updateSeriesReportStatus(reportId: string, status: string) {
  try {
    await db.update(seriesReports).set({ status }).where(eq(seriesReports.id, reportId))
    return { success: true }
  } catch (error) {
    console.error("Error updating report status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function deleteSeriesReport(reportId: string) {
  try {
    await db.delete(seriesReports).where(eq(seriesReports.id, reportId))
    return { success: true }
  } catch (error) {
    console.error("Error deleting report:", error)
    return { success: false, error: "Failed to delete report" }
  }
}
