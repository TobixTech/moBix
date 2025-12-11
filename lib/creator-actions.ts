"use server"

import { db } from "@/lib/db"
import {
  users,
  creatorRequests,
  creatorProfiles,
  contentSubmissions,
  submissionEpisodes,
  creatorAnalytics,
  creatorNotifications,
  creatorStrikes,
  dailyUploadTracking,
  creatorSettings,
  movies,
  series,
  seasons,
  episodes,
} from "@/lib/db/schema"
import { eq, desc, and, sql, count, gte } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { generateSlug } from "@/lib/server-actions"

async function getCreatorSettingsWithDefaults() {
  const [settings] = await db.select().from(creatorSettings).limit(1)

  // Return default values if no settings exist
  if (!settings) {
    return {
      id: "default",
      minAccountAgeDays: 30,
      maxAccountAgeDays: 90,
      defaultDailyUploadLimit: 4,
      defaultDailyStorageLimitGb: "8",
      autoApproveNewCreators: false,
      maxStrikesBeforeSuspension: 3,
      isCreatorSystemEnabled: true, // Default to enabled
    }
  }

  return settings
}

// Get current user's creator status
export async function getCreatorStatus() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const settings = await getCreatorSettingsWithDefaults()
    const isCreatorSystemEnabled = settings.isCreatorSystemEnabled ?? true

    // Check if user has a creator profile (approved)
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)

    if (profile) {
      // Get daily tracking for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [dailyTrack] = await db
        .select()
        .from(dailyUploadTracking)
        .where(and(eq(dailyUploadTracking.creatorId, profile.id), gte(dailyUploadTracking.date, today)))
        .limit(1)

      // Get strike count
      const strikeCount = await db
        .select({ count: count() })
        .from(creatorStrikes)
        .where(eq(creatorStrikes.creatorId, profile.id))

      return {
        success: true,
        isCreator: true,
        status: "approved",
        isCreatorSystemEnabled, // Always include for consistency
        profile: {
          ...profile,
          uploadsToday: dailyTrack?.uploadsToday || 0,
          storageUsedToday: dailyTrack?.storageUsedTodayGb || 0,
          strikeCount: strikeCount[0]?.count || 0,
        },
        accountAgeDays: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      }
    }

    // Check for pending or rejected requests
    const [request] = await db
      .select()
      .from(creatorRequests)
      .where(eq(creatorRequests.userId, user.id))
      .orderBy(desc(creatorRequests.requestedAt))
      .limit(1)

    const minAgeDays = settings.minAccountAgeDays || 30
    const maxAgeDays = settings.maxAccountAgeDays || 90

    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    const isEligible = accountAgeDays >= minAgeDays && accountAgeDays <= maxAgeDays

    return {
      success: true,
      isCreator: false,
      status: request?.status || "none",
      rejectionReason: request?.rejectionReason,
      requestedAt: request?.requestedAt,
      accountAgeDays,
      minAgeDays,
      maxAgeDays,
      isEligible,
      isCreatorSystemEnabled,
    }
  } catch (error) {
    console.error("Error getting creator status:", error)
    return { success: false, error: "Failed to get creator status", isCreatorSystemEnabled: true }
  }
}

// Request creator access
export async function requestCreatorAccess() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if already a creator
    const [existingProfile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1)

    if (existingProfile) {
      return { success: false, error: "You are already a creator" }
    }

    // Check for pending request
    const [pendingRequest] = await db
      .select()
      .from(creatorRequests)
      .where(and(eq(creatorRequests.userId, user.id), eq(creatorRequests.status, "pending")))
      .limit(1)

    if (pendingRequest) {
      return { success: false, error: "You already have a pending request" }
    }

    // Check eligibility
    const settings = await getCreatorSettingsWithDefaults()
    const minAgeDays = settings.minAccountAgeDays || 30
    const maxAgeDays = settings.maxAccountAgeDays || 90
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))

    if (accountAgeDays < minAgeDays) {
      return {
        success: false,
        error: `Your account must be at least ${minAgeDays} days old to request creator access. Current age: ${accountAgeDays} days.`,
      }
    }

    if (accountAgeDays > maxAgeDays) {
      return {
        success: false,
        error: `Creator requests are only available for accounts between ${minAgeDays}-${maxAgeDays} days old. Please contact support.`,
      }
    }

    // Create request
    await db.insert(creatorRequests).values({
      userId: user.id,
      status: "pending",
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Creator access request submitted successfully" }
  } catch (error) {
    console.error("Error requesting creator access:", error)
    return { success: false, error: "Failed to submit request" }
  }
}

// Get creator dashboard data
export async function getCreatorDashboardData() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)

    if (!profile) {
      return { success: false, error: "Not a creator" }
    }

    // Get all submissions
    const submissions = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.creatorId, profile.id))
      .orderBy(desc(contentSubmissions.submittedAt))

    const processedSubmissions = submissions.map((submission) => {
      // Check if content was approved but the published movie/series was deleted
      const wasApprovedButDeleted =
        submission.status === "approved" &&
        ((submission.type === "movie" && !submission.publishedMovieId) ||
          (submission.type === "series" && !submission.publishedSeriesId))

      return {
        ...submission,
        isDeleted: wasApprovedButDeleted,
        displayStatus: wasApprovedButDeleted ? "deleted" : submission.status,
      }
    })

    // Get daily tracking
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [dailyTrack] = await db
      .select()
      .from(dailyUploadTracking)
      .where(and(eq(dailyUploadTracking.creatorId, profile.id), gte(dailyUploadTracking.date, today)))
      .limit(1)

    // Get analytics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const analytics = await db
      .select({
        date: creatorAnalytics.date,
        views: sql<number>`SUM(${creatorAnalytics.views})`,
        watchTime: sql<number>`SUM(${creatorAnalytics.watchTimeMinutes})`,
        likes: sql<number>`SUM(${creatorAnalytics.likes})`,
      })
      .from(creatorAnalytics)
      .innerJoin(contentSubmissions, eq(creatorAnalytics.submissionId, contentSubmissions.id))
      .where(and(eq(contentSubmissions.creatorId, profile.id), gte(creatorAnalytics.date, thirtyDaysAgo)))
      .groupBy(creatorAnalytics.date)
      .orderBy(creatorAnalytics.date)

    // Get unread notifications count
    const [notifCount] = await db
      .select({ count: count() })
      .from(creatorNotifications)
      .where(and(eq(creatorNotifications.userId, user.id), eq(creatorNotifications.isRead, false)))

    // Get strike count
    const [strikeCount] = await db
      .select({ count: count() })
      .from(creatorStrikes)
      .where(eq(creatorStrikes.creatorId, profile.id))

    const activeSubmissions = processedSubmissions.filter((s) => !s.isDeleted)
    const totalViews = activeSubmissions.reduce((sum, s) => sum + s.viewsCount, 0)
    const totalLikes = activeSubmissions.reduce((sum, s) => sum + s.likesCount, 0)
    const approvedCount = processedSubmissions.filter((s) => s.status === "approved" && !s.isDeleted).length
    const pendingCount = processedSubmissions.filter((s) => s.status === "pending").length
    const rejectedCount = processedSubmissions.filter((s) => s.status === "rejected").length
    const deletedCount = processedSubmissions.filter((s) => s.isDeleted).length

    return {
      success: true,
      profile,
      submissions: processedSubmissions,
      dailyTracking: {
        uploadsToday: dailyTrack?.uploadsToday || 0,
        storageUsedToday: Number(dailyTrack?.storageUsedTodayGb) || 0,
        uploadLimit: profile.dailyUploadLimit,
        storageLimit: Number(profile.dailyStorageLimitGb),
      },
      analytics,
      stats: {
        totalUploads: submissions.length,
        totalViews,
        totalLikes,
        approvedCount,
        pendingCount,
        rejectedCount,
        deletedCount, // Add deleted count to stats
        strikeCount: strikeCount?.count || 0,
        unreadNotifications: notifCount?.count || 0,
      },
    }
  } catch (error) {
    console.error("Error getting creator dashboard:", error)
    return { success: false, error: "Failed to load dashboard" }
  }
}

// Get creator notifications
export async function getCreatorNotifications() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const notifications = await db
      .select()
      .from(creatorNotifications)
      .where(eq(creatorNotifications.userId, user.id))
      .orderBy(desc(creatorNotifications.createdAt))
      .limit(50)

    return { success: true, notifications }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { success: false, error: "Failed to load notifications" }
  }
}

// Mark notification as read
export async function markCreatorNotificationRead(notificationId: string) {
  try {
    await db.update(creatorNotifications).set({ isRead: true }).where(eq(creatorNotifications.id, notificationId))

    return { success: true }
  } catch (error) {
    console.error("Error marking notification read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

// Mark all notifications as read
export async function markAllCreatorNotificationsRead() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    await db.update(creatorNotifications).set({ isRead: true }).where(eq(creatorNotifications.userId, user.id))

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications read:", error)
    return { success: false, error: "Failed to mark notifications as read" }
  }
}

// Submit content (movie or series)
export async function submitContent(data: {
  type: "movie" | "series"
  title: string
  description: string
  genre: string
  year?: number
  videoUrl?: string
  thumbnailUrl: string
  bannerUrl?: string
  fileSizeGb?: number
  seriesData?: {
    totalSeasons: number
    totalEpisodes: number
    status: string
  }
  episodes?: {
    seasonNumber: number
    episodeNumber: number
    title: string
    description?: string
    videoUrl: string
    thumbnailUrl?: string
    duration?: number
    fileSizeGb?: number
  }[]
}) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)

    if (!profile) {
      return { success: false, error: "Not a creator" }
    }

    if (profile.status !== "active") {
      return { success: false, error: "Your creator account is suspended" }
    }

    // Check daily limits
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let [dailyTrack] = await db
      .select()
      .from(dailyUploadTracking)
      .where(and(eq(dailyUploadTracking.creatorId, profile.id), gte(dailyUploadTracking.date, today)))
      .limit(1)

    if (!dailyTrack) {
      // Create new daily tracking
      const [newTrack] = await db
        .insert(dailyUploadTracking)
        .values({
          creatorId: profile.id,
          date: today,
          uploadsToday: 0,
          storageUsedTodayGb: "0",
        })
        .returning()
      dailyTrack = newTrack
    }

    // Check upload limit
    if (dailyTrack.uploadsToday >= profile.dailyUploadLimit) {
      return {
        success: false,
        error: `Daily upload limit reached (${profile.dailyUploadLimit} uploads per day)`,
      }
    }

    // Calculate total file size
    let totalSize = data.fileSizeGb || 0
    if (data.episodes) {
      totalSize += data.episodes.reduce((sum, ep) => sum + (ep.fileSizeGb || 0), 0)
    }

    // Check storage limit
    const currentStorage = Number(dailyTrack.storageUsedTodayGb) || 0
    const storageLimit = Number(profile.dailyStorageLimitGb) || 8
    if (currentStorage + totalSize > storageLimit) {
      return {
        success: false,
        error: `Daily storage limit would be exceeded. Used: ${currentStorage.toFixed(2)}GB, Limit: ${storageLimit}GB`,
      }
    }

    // Validation
    if (!data.title || data.title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters" }
    }
    if (!data.description || data.description.length < 20) {
      return { success: false, error: "Description must be at least 20 characters" }
    }
    if (!data.genre) {
      return { success: false, error: "Genre is required" }
    }
    if (!data.thumbnailUrl) {
      return { success: false, error: "Thumbnail is required" }
    }
    if (data.type === "movie" && !data.videoUrl) {
      return { success: false, error: "Video URL is required for movies" }
    }
    if (data.type === "series" && (!data.episodes || data.episodes.length === 0)) {
      return { success: false, error: "At least one episode is required for series" }
    }

    // Determine status (auto-approve or pending)
    const initialStatus = profile.isAutoApproveEnabled ? "approved" : "pending"

    // Create submission
    const [submission] = await db
      .insert(contentSubmissions)
      .values({
        creatorId: profile.id,
        type: data.type,
        title: data.title,
        description: data.description,
        genre: data.genre,
        year: data.year,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        bannerUrl: data.bannerUrl,
        status: initialStatus,
        seriesData: data.seriesData ? JSON.stringify(data.seriesData) : null,
        fileSizeGb: totalSize.toString(),
      })
      .returning()

    // Add episodes if series
    if (data.type === "series" && data.episodes) {
      for (const ep of data.episodes) {
        await db.insert(submissionEpisodes).values({
          submissionId: submission.id,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          description: ep.description,
          videoUrl: ep.videoUrl,
          thumbnailUrl: ep.thumbnailUrl,
          duration: ep.duration,
          fileSizeGb: ep.fileSizeGb?.toString(),
        })
      }
    }

    // Update daily tracking
    await db
      .update(dailyUploadTracking)
      .set({
        uploadsToday: dailyTrack.uploadsToday + 1,
        storageUsedTodayGb: (currentStorage + totalSize).toString(),
      })
      .where(eq(dailyUploadTracking.id, dailyTrack.id))

    // Update total uploads in profile
    await db
      .update(creatorProfiles)
      .set({ totalUploads: profile.totalUploads + 1 })
      .where(eq(creatorProfiles.id, profile.id))

    // If auto-approved, publish immediately
    if (initialStatus === "approved") {
      await publishSubmission(submission.id)

      // Create notification
      await db.insert(creatorNotifications).values({
        userId: user.id,
        type: "submission_approved",
        title: "Content Published!",
        message: `Your ${data.type} "${data.title}" has been auto-approved and is now live!`,
        submissionId: submission.id,
      })
    } else {
      // Create notification for pending
      await db.insert(creatorNotifications).values({
        userId: user.id,
        type: "system",
        title: "Content Submitted",
        message: `Your ${data.type} "${data.title}" has been submitted for review. You'll be notified once it's reviewed.`,
        submissionId: submission.id,
      })
    }

    revalidatePath("/creator")
    return { success: true, submission, autoApproved: initialStatus === "approved" }
  } catch (error) {
    console.error("Error submitting content:", error)
    return { success: false, error: "Failed to submit content" }
  }
}

// Publish approved submission to main site
async function publishSubmission(submissionId: string) {
  try {
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) return

    if (submission.type === "movie") {
      const slug = await generateSlug(submission.title)
      const [movie] = await db
        .insert(movies)
        .values({
          title: submission.title,
          slug,
          description: submission.description,
          genre: submission.genre,
          year: submission.year || new Date().getFullYear(),
          posterUrl: submission.thumbnailUrl,
          videoUrl: submission.videoUrl || "",
        })
        .returning()

      await db
        .update(contentSubmissions)
        .set({ publishedMovieId: movie.id })
        .where(eq(contentSubmissions.id, submissionId))
    } else if (submission.type === "series") {
      const slug = await generateSlug(submission.title)
      const seriesData = submission.seriesData ? JSON.parse(submission.seriesData) : {}

      const [newSeries] = await db
        .insert(series)
        .values({
          title: submission.title,
          slug,
          description: submission.description,
          genre: submission.genre,
          posterUrl: submission.thumbnailUrl,
          bannerUrl: submission.bannerUrl,
          releaseYear: submission.year || new Date().getFullYear(),
          status: seriesData.status || "ongoing",
          totalSeasons: seriesData.totalSeasons || 1,
          totalEpisodes: seriesData.totalEpisodes || 0,
        })
        .returning()

      // Get submission episodes
      const subEpisodes = await db
        .select()
        .from(submissionEpisodes)
        .where(eq(submissionEpisodes.submissionId, submissionId))

      // Group by season
      const seasonMap = new Map<number, typeof subEpisodes>()
      for (const ep of subEpisodes) {
        if (!seasonMap.has(ep.seasonNumber)) {
          seasonMap.set(ep.seasonNumber, [])
        }
        seasonMap.get(ep.seasonNumber)!.push(ep)
      }

      // Create seasons and episodes
      for (const [seasonNum, eps] of seasonMap) {
        const [season] = await db
          .insert(seasons)
          .values({
            seriesId: newSeries.id,
            seasonNumber: seasonNum,
            totalEpisodes: eps.length,
          })
          .returning()

        for (const ep of eps) {
          await db.insert(episodes).values({
            seasonId: season.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description,
            videoUrl: ep.videoUrl,
            thumbnailUrl: ep.thumbnailUrl,
            duration: ep.duration,
          })
        }
      }

      await db
        .update(contentSubmissions)
        .set({ publishedSeriesId: newSeries.id })
        .where(eq(contentSubmissions.id, submissionId))
    }
  } catch (error) {
    console.error("Error publishing submission:", error)
  }
}

// Delete submission (only if pending)
export async function deleteSubmission(submissionId: string) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)

    if (!profile) {
      return { success: false, error: "Not a creator" }
    }

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(and(eq(contentSubmissions.id, submissionId), eq(contentSubmissions.creatorId, profile.id)))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    if (submission.status !== "pending") {
      return { success: false, error: "Can only delete pending submissions" }
    }

    await db.delete(contentSubmissions).where(eq(contentSubmissions.id, submissionId))

    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error deleting submission:", error)
    return { success: false, error: "Failed to delete submission" }
  }
}

// Get submission details
export async function getSubmissionDetails(submissionId: string) {
  try {
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    let eps: any[] = []
    if (submission.type === "series") {
      eps = await db
        .select()
        .from(submissionEpisodes)
        .where(eq(submissionEpisodes.submissionId, submissionId))
        .orderBy(submissionEpisodes.seasonNumber, submissionEpisodes.episodeNumber)
    }

    return { success: true, submission, episodes: eps }
  } catch (error) {
    console.error("Error getting submission:", error)
    return { success: false, error: "Failed to load submission" }
  }
}

export async function getSubmissionEpisodes(submissionId: number) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUser.id),
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify ownership
    const submission = await db.query.contentSubmissions.findFirst({
      where: eq(contentSubmissions.id, submissionId),
    })

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    // Get creator profile
    const creator = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, user.id),
    })

    if (!creator || submission.creatorId !== creator.id) {
      return { success: false, error: "Not authorized" }
    }

    // Get episodes
    const episodesList = await db
      .select()
      .from(submissionEpisodes)
      .where(eq(submissionEpisodes.submissionId, submissionId))
      .orderBy(submissionEpisodes.seasonNumber, submissionEpisodes.episodeNumber)

    return {
      success: true,
      episodes: episodesList,
    }
  } catch (error: any) {
    console.error("Error fetching submission episodes:", error)
    return { success: false, error: error.message }
  }
}

// Add episodes to submission
export async function addEpisodesToSubmission(
  submissionId: string,
  newEpisodes: Array<{
    seasonNumber: number
    episodeNumber: number
    title: string
    description?: string
    videoUrl: string
  }>,
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)
    if (!profile) {
      return { success: false, error: "Not a creator" }
    }

    // Verify submission belongs to this creator
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(and(eq(contentSubmissions.id, submissionId), eq(contentSubmissions.creatorId, profile.id)))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    if (submission.type !== "series") {
      return { success: false, error: "Can only add episodes to series" }
    }

    // Insert new episodes
    for (const ep of newEpisodes) {
      await db.insert(submissionEpisodes).values({
        submissionId,
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        description: ep.description || "",
        videoUrl: ep.videoUrl,
      })
    }

    // Update series data
    const existingData = submission.seriesData
      ? JSON.parse(submission.seriesData)
      : { totalSeasons: 1, totalEpisodes: 0 }
    const maxSeason = Math.max(existingData.totalSeasons, ...newEpisodes.map((e) => e.seasonNumber))
    const newTotalEpisodes = existingData.totalEpisodes + newEpisodes.length

    await db
      .update(contentSubmissions)
      .set({
        seriesData: JSON.stringify({
          totalSeasons: maxSeason,
          totalEpisodes: newTotalEpisodes,
          status: "ongoing",
        }),
      })
      .where(eq(contentSubmissions.id, submissionId))

    // Update daily tracking
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [dailyTrack] = await db
      .select()
      .from(dailyUploadTracking)
      .where(and(eq(dailyUploadTracking.creatorId, profile.id), gte(dailyUploadTracking.date, today)))
      .limit(1)

    if (dailyTrack) {
      await db
        .update(dailyUploadTracking)
        .set({ uploadsToday: dailyTrack.uploadsToday + newEpisodes.length })
        .where(eq(dailyUploadTracking.id, dailyTrack.id))
    } else {
      await db.insert(dailyUploadTracking).values({
        creatorId: profile.id,
        date: today,
        uploadsToday: newEpisodes.length,
        storageUsedTodayGb: "0",
      })
    }

    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error adding episodes:", error)
    return { success: false, error: "Failed to add episodes" }
  }
}

// Update submission function for creators to edit their content
export async function updateSubmission(
  submissionId: string,
  data: {
    title?: string
    description?: string
    genre?: string
    year?: number
  },
) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)
    if (!profile) {
      return { success: false, error: "Not a creator" }
    }

    // Verify submission belongs to this creator
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(and(eq(contentSubmissions.id, submissionId), eq(contentSubmissions.creatorId, profile.id)))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    // Only allow editing text fields, not video/thumbnail URLs
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.genre !== undefined) updateData.genre = data.genre
    if (data.year !== undefined) updateData.year = data.year

    await db.update(contentSubmissions).set(updateData).where(eq(contentSubmissions.id, submissionId))

    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error updating submission:", error)
    return { success: false, error: "Failed to update submission" }
  }
}
