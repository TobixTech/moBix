"use server"

import { db } from "@/lib/db"
import { series, seasons, episodes, seriesWatchHistory, seriesWatchlist, seriesRatings } from "@/lib/db/schema"
import { eq, desc, asc, sql, and, ilike, or } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ============ SERIES CRUD ============

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
    const slug = generateSlug(data.title)
    const result = await db
      .insert(series)
      .values({
        ...data,
        slug,
        status: data.status || "ongoing",
      })
      .returning()

    revalidatePath("/admin/dashboard")
    revalidatePath("/series")
    return { success: true, series: result[0] }
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
    isTrending?: boolean
    isFeatured?: boolean
  },
) {
  try {
    const updateData: any = { ...data }
    if (data.title) {
      updateData.slug = generateSlug(data.title)
    }

    const result = await db.update(series).set(updateData).where(eq(series.id, id)).returning()

    revalidatePath("/admin/dashboard")
    revalidatePath("/series")
    revalidatePath(`/series/${result[0]?.slug || id}`)
    return { success: true, series: result[0] }
  } catch (error) {
    console.error("Error updating series:", error)
    return { success: false, error: "Failed to update series" }
  }
}

export async function deleteSeries(id: string) {
  try {
    await db.delete(series).where(eq(series.id, id))
    revalidatePath("/admin/dashboard")
    revalidatePath("/series")
    return { success: true }
  } catch (error) {
    console.error("Error deleting series:", error)
    return { success: false, error: "Failed to delete series" }
  }
}

export async function getAllSeries() {
  try {
    const result = await db.select().from(series).orderBy(desc(series.createdAt))
    return result
  } catch (error) {
    console.error("Error fetching series:", error)
    return []
  }
}

export async function getSeriesById(id: string) {
  try {
    const result = await db.select().from(series).where(eq(series.id, id)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error("Error fetching series:", error)
    return null
  }
}

export async function getSeriesBySlug(slug: string) {
  try {
    const result = await db.select().from(series).where(eq(series.slug, slug)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error("Error fetching series:", error)
    return null
  }
}

export async function getTrendingSeries(limit = 10) {
  try {
    const result = await db
      .select()
      .from(series)
      .where(eq(series.isTrending, true))
      .orderBy(desc(series.views))
      .limit(limit)
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

export async function searchSeries(query: string) {
  try {
    const result = await db
      .select()
      .from(series)
      .where(or(ilike(series.title, `%${query}%`), ilike(series.description, `%${query}%`)))
      .orderBy(desc(series.views))
      .limit(20)
    return result
  } catch (error) {
    console.error("Error searching series:", error)
    return []
  }
}

// ============ SEASONS CRUD ============

export async function createSeason(data: {
  seriesId: string
  seasonNumber: number
  title?: string
  description?: string
  posterUrl?: string
  releaseYear?: number
}) {
  try {
    const result = await db.insert(seasons).values(data).returning()

    // Update series total seasons count
    await db
      .update(series)
      .set({
        totalSeasons: sql`(SELECT COUNT(*) FROM "Season" WHERE "seriesId" = ${data.seriesId})`,
      })
      .where(eq(series.id, data.seriesId))

    revalidatePath("/admin/dashboard")
    return { success: true, season: result[0] }
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
    posterUrl?: string
    releaseYear?: number
  },
) {
  try {
    const result = await db.update(seasons).set(data).where(eq(seasons.id, id)).returning()
    revalidatePath("/admin/dashboard")
    return { success: true, season: result[0] }
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
      // Update series total seasons count
      await db
        .update(series)
        .set({
          totalSeasons: sql`(SELECT COUNT(*) FROM "Season" WHERE "seriesId" = ${season[0].seriesId})`,
        })
        .where(eq(series.id, season[0].seriesId))
    }
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting season:", error)
    return { success: false, error: "Failed to delete season" }
  }
}

export async function getSeasonsBySeriesId(seriesId: string) {
  try {
    const result = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seriesId, seriesId))
      .orderBy(asc(seasons.seasonNumber))
    return result
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return []
  }
}

// ============ EPISODES CRUD ============

export async function createEpisode(data: {
  seasonId: string
  episodeNumber: number
  title: string
  description?: string
  duration?: number
  thumbnailUrl?: string
  videoUrl: string
  downloadUrl?: string
  downloadEnabled?: boolean
}) {
  try {
    const result = await db.insert(episodes).values(data).returning()

    // Update season total episodes count
    const season = await db.select().from(seasons).where(eq(seasons.id, data.seasonId)).limit(1)
    if (season[0]) {
      await db
        .update(seasons)
        .set({
          totalEpisodes: sql`(SELECT COUNT(*) FROM "Episode" WHERE "seasonId" = ${data.seasonId})`,
        })
        .where(eq(seasons.id, data.seasonId))

      // Update series total episodes count
      await db
        .update(series)
        .set({
          totalEpisodes: sql`(SELECT COUNT(*) FROM "Episode" e JOIN "Season" s ON e."seasonId" = s."id" WHERE s."seriesId" = ${season[0].seriesId})`,
        })
        .where(eq(series.id, season[0].seriesId))
    }

    revalidatePath("/admin/dashboard")
    return { success: true, episode: result[0] }
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
    downloadUrl?: string
    downloadEnabled?: boolean
  },
) {
  try {
    const result = await db.update(episodes).set(data).where(eq(episodes.id, id)).returning()
    revalidatePath("/admin/dashboard")
    return { success: true, episode: result[0] }
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
        // Update season total episodes count
        await db
          .update(seasons)
          .set({
            totalEpisodes: sql`(SELECT COUNT(*) FROM "Episode" WHERE "seasonId" = ${episode[0].seasonId})`,
          })
          .where(eq(seasons.id, episode[0].seasonId))

        // Update series total episodes count
        await db
          .update(series)
          .set({
            totalEpisodes: sql`(SELECT COUNT(*) FROM "Episode" e JOIN "Season" s ON e."seasonId" = s."id" WHERE s."seriesId" = ${season[0].seriesId})`,
          })
          .where(eq(series.id, season[0].seriesId))
      }
    }
    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting episode:", error)
    return { success: false, error: "Failed to delete episode" }
  }
}

export async function getEpisodesBySeasonId(seasonId: string) {
  try {
    const result = await db
      .select()
      .from(episodes)
      .where(eq(episodes.seasonId, seasonId))
      .orderBy(asc(episodes.episodeNumber))
    return result
  } catch (error) {
    console.error("Error fetching episodes:", error)
    return []
  }
}

export async function getEpisodeById(id: string) {
  try {
    const result = await db.select().from(episodes).where(eq(episodes.id, id)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error("Error fetching episode:", error)
    return null
  }
}

// ============ SERIES WITH DETAILS ============

export async function getSeriesWithSeasons(seriesIdOrSlug: string) {
  try {
    // Try to find by slug first, then by ID
    let seriesData = await db.select().from(series).where(eq(series.slug, seriesIdOrSlug)).limit(1)
    if (!seriesData[0]) {
      seriesData = await db.select().from(series).where(eq(series.id, seriesIdOrSlug)).limit(1)
    }

    if (!seriesData[0]) return null

    const seasonsData = await db
      .select()
      .from(seasons)
      .where(eq(seasons.seriesId, seriesData[0].id))
      .orderBy(asc(seasons.seasonNumber))

    // Get episodes for each season
    const seasonsWithEpisodes = await Promise.all(
      seasonsData.map(async (season) => {
        const episodesData = await db
          .select()
          .from(episodes)
          .where(eq(episodes.seasonId, season.id))
          .orderBy(asc(episodes.episodeNumber))
        return { ...season, episodes: episodesData }
      }),
    )

    // Increment view count
    await db
      .update(series)
      .set({ views: sql`${series.views} + 1` })
      .where(eq(series.id, seriesData[0].id))

    return { ...seriesData[0], seasons: seasonsWithEpisodes }
  } catch (error) {
    console.error("Error fetching series with seasons:", error)
    return null
  }
}

// ============ USER ACTIONS ============

export async function addToSeriesWatchlist(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db.insert(seriesWatchlist).values({ userId: user[0].id, seriesId }).onConflictDoNothing()

    revalidatePath("/watchlist")
    return { success: true }
  } catch (error) {
    console.error("Error adding to series watchlist:", error)
    return { success: false, error: "Failed to add to watchlist" }
  }
}

export async function removeFromSeriesWatchlist(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db
      .delete(seriesWatchlist)
      .where(and(eq(seriesWatchlist.userId, user[0].id), eq(seriesWatchlist.seriesId, seriesId)))

    revalidatePath("/watchlist")
    return { success: true }
  } catch (error) {
    console.error("Error removing from series watchlist:", error)
    return { success: false, error: "Failed to remove from watchlist" }
  }
}

export async function isSeriesInWatchlist(seriesId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return false

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return false

    const result = await db
      .select()
      .from(seriesWatchlist)
      .where(and(eq(seriesWatchlist.userId, user[0].id), eq(seriesWatchlist.seriesId, seriesId)))
      .limit(1)

    return result.length > 0
  } catch (error) {
    console.error("Error checking series watchlist:", error)
    return false
  }
}

export async function rateSeriesAction(seriesId: string, rating: number) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" }

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return { success: false, error: "User not found" }

    await db
      .insert(seriesRatings)
      .values({ userId: user[0].id, seriesId, rating })
      .onConflictDoUpdate({
        target: [seriesRatings.userId, seriesRatings.seriesId],
        set: { rating },
      })

    // Update average rating
    const avgResult = await db
      .select({ avg: sql<number>`AVG(rating)` })
      .from(seriesRatings)
      .where(eq(seriesRatings.seriesId, seriesId))

    await db
      .update(series)
      .set({ averageRating: String(avgResult[0]?.avg || 0) })
      .where(eq(series.id, seriesId))

    revalidatePath(`/series/${seriesId}`)
    return { success: true }
  } catch (error) {
    console.error("Error rating series:", error)
    return { success: false, error: "Failed to rate series" }
  }
}

export async function updateEpisodeWatchProgress(
  episodeId: string,
  seriesId: string,
  progress: number,
  duration: number,
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false }

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return { success: false }

    await db
      .insert(seriesWatchHistory)
      .values({
        userId: user[0].id,
        seriesId,
        episodeId,
        progress,
        duration,
      })
      .onConflictDoUpdate({
        target: [seriesWatchHistory.userId, seriesWatchHistory.episodeId],
        set: { progress, duration, watchedAt: new Date() },
      })

    return { success: true }
  } catch (error) {
    console.error("Error updating episode watch progress:", error)
    return { success: false }
  }
}

export async function getContinueWatchingSeries() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return []

    const user = await db
      .select()
      .from(require("@/lib/db/schema").users)
      .where(eq(require("@/lib/db/schema").users.clerkId, clerkId))
      .limit(1)
    if (!user[0]) return []

    const result = await db
      .select({
        series: series,
        episode: episodes,
        season: seasons,
        progress: seriesWatchHistory.progress,
        watchedAt: seriesWatchHistory.watchedAt,
      })
      .from(seriesWatchHistory)
      .innerJoin(series, eq(seriesWatchHistory.seriesId, series.id))
      .innerJoin(episodes, eq(seriesWatchHistory.episodeId, episodes.id))
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .where(
        and(
          eq(seriesWatchHistory.userId, user[0].id),
          sql`${seriesWatchHistory.progress} > 5`,
          sql`${seriesWatchHistory.progress} < 95`,
        ),
      )
      .orderBy(desc(seriesWatchHistory.watchedAt))
      .limit(10)

    return result
  } catch (error) {
    console.error("Error fetching continue watching series:", error)
    return []
  }
}

export async function getSeriesGenres() {
  try {
    const result = await db.selectDistinct({ genre: series.genre }).from(series).orderBy(asc(series.genre))
    return result.map((r) => r.genre)
  } catch (error) {
    console.error("Error fetching series genres:", error)
    return []
  }
}

export async function getAdminSeries() {
  try {
    const allSeries = await db.select().from(series).orderBy(desc(series.createdAt))

    // Get seasons and episodes for each series
    const seriesWithDetails = await Promise.all(
      allSeries.map(async (s) => {
        const seasonsData = await db
          .select()
          .from(seasons)
          .where(eq(seasons.seriesId, s.id))
          .orderBy(asc(seasons.seasonNumber))

        const seasonsWithEpisodes = await Promise.all(
          seasonsData.map(async (season) => {
            const episodesData = await db
              .select()
              .from(episodes)
              .where(eq(episodes.seasonId, season.id))
              .orderBy(asc(episodes.episodeNumber))
            return {
              id: Number(season.id),
              seasonNumber: season.seasonNumber,
              title: season.title,
              description: season.description,
              episodes: episodesData.map((ep) => ({
                id: Number(ep.id),
                episodeNumber: ep.episodeNumber,
                title: ep.title,
                description: ep.description,
                duration: ep.duration ? String(ep.duration) : null,
                videoUrl: ep.videoUrl,
                thumbnailUrl: ep.thumbnailUrl,
              })),
            }
          }),
        )

        return {
          id: Number(s.id),
          title: s.title,
          description: s.description,
          posterUrl: s.posterUrl,
          bannerUrl: s.bannerUrl,
          genre: s.genre,
          status: s.status || "ongoing",
          releaseYear: s.releaseYear,
          rating: s.averageRating,
          seasons: seasonsWithEpisodes,
        }
      }),
    )

    return seriesWithDetails
  } catch (error) {
    console.error("Error fetching admin series:", error)
    return []
  }
}
