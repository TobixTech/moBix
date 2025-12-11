"use server"

import { db } from "@/lib/db"
import {
  users,
  creatorRequests,
  creatorProfiles,
  contentSubmissions,
  submissionEpisodes,
  creatorNotifications,
  creatorStrikes,
  creatorSettings,
  movies,
  series,
  seasons,
  episodes,
} from "@/lib/db/schema"
import { eq, desc, and, count, gte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Get all creator requests for admin
export async function getCreatorRequests(status?: string) {
  try {
    const query = db
      .select({
        id: creatorRequests.id,
        userId: creatorRequests.userId,
        status: creatorRequests.status,
        requestedAt: creatorRequests.requestedAt,
        reviewedAt: creatorRequests.reviewedAt,
        rejectionReason: creatorRequests.rejectionReason,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        },
      })
      .from(creatorRequests)
      .leftJoin(users, eq(creatorRequests.userId, users.id))
      .orderBy(desc(creatorRequests.requestedAt))

    const requests = await query

    // Calculate account age for each request
    const requestsWithAge = requests.map((r) => ({
      ...r,
      accountAgeDays: Math.floor((Date.now() - new Date(r.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    }))

    // Filter by status if provided
    if (status && status !== "all") {
      return { success: true, requests: requestsWithAge.filter((r) => r.status === status) }
    }

    return { success: true, requests: requestsWithAge }
  } catch (error) {
    console.error("Error getting creator requests:", error)
    return { success: false, error: "Failed to get creator requests" }
  }
}

// Approve creator request
export async function approveCreatorRequest(requestId: string, _adminUserId?: string) {
  try {
    const [request] = await db.select().from(creatorRequests).where(eq(creatorRequests.id, requestId)).limit(1)

    if (!request) {
      return { success: false, error: "Request not found" }
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request already processed" }
    }

    // Get creator settings for default limits
    const [settings] = await db.select().from(creatorSettings).limit(1)

    // Update request status
    await db
      .update(creatorRequests)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: null,
      })
      .where(eq(creatorRequests.id, requestId))

    // Check if creator profile already exists
    const [existingProfile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, request.userId))
      .limit(1)

    if (!existingProfile) {
      // Create creator profile
      await db.insert(creatorProfiles).values({
        userId: request.userId,
        dailyUploadLimit: settings?.defaultDailyUploadLimit || 4,
        dailyStorageLimitGb: settings?.defaultDailyStorageLimitGb?.toString() || "8",
        isAutoApproveEnabled: false,
      })
    }

    // Create notification for user
    await db.insert(creatorNotifications).values({
      userId: request.userId,
      type: "system",
      title: "Creator Access Approved!",
      message:
        "Congratulations! Your creator access request has been approved. You can now start uploading content to moBix.",
    })

    revalidatePath("/admin/dashboard")
    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error approving creator request:", error)
    return { success: false, error: "Failed to approve request" }
  }
}

// Reject creator request
export async function rejectCreatorRequest(requestId: string, _adminUserId?: string, reason?: string) {
  try {
    const [request] = await db.select().from(creatorRequests).where(eq(creatorRequests.id, requestId)).limit(1)

    if (!request) {
      return { success: false, error: "Request not found" }
    }

    await db
      .update(creatorRequests)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: null,
        rejectionReason: reason || "Request rejected by admin",
      })
      .where(eq(creatorRequests.id, requestId))

    // Create notification for user
    await db.insert(creatorNotifications).values({
      userId: request.userId,
      type: "system",
      title: "Creator Access Request Rejected",
      message: `Your creator access request was not approved. Reason: ${reason || "Request rejected by admin"}`,
    })

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting creator request:", error)
    return { success: false, error: "Failed to reject request" }
  }
}

// Grant creator access manually (bypass eligibility)
export async function grantCreatorAccess(userEmail: string, _adminUserId?: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1)

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
      return { success: false, error: "User is already a creator" }
    }

    // Get creator settings for default limits
    const [settings] = await db.select().from(creatorSettings).limit(1)

    // Create creator profile
    await db.insert(creatorProfiles).values({
      userId: user.id,
      dailyUploadLimit: settings?.defaultDailyUploadLimit || 4,
      dailyStorageLimitGb: settings?.defaultDailyStorageLimitGb?.toString() || "8",
      isAutoApproveEnabled: false,
    })

    // Create notification for user
    await db.insert(creatorNotifications).values({
      userId: user.id,
      type: "system",
      title: "Creator Access Granted!",
      message:
        "You have been granted creator access by an administrator. You can now start uploading content to moBix.",
    })

    revalidatePath("/admin/dashboard")
    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error granting creator access:", error)
    return { success: false, error: "Failed to grant access" }
  }
}

// Approve content submission
export async function approveSubmission(submissionId: string, _adminUserId?: string) {
  try {
    console.log("[approveSubmission] Starting approval for:", submissionId)

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      console.log("[approveSubmission] Submission not found")
      return { success: false, error: "Submission not found" }
    }

    console.log("[approveSubmission] Found submission:", {
      id: submission.id,
      title: submission.title,
      type: submission.type,
      status: submission.status,
    })

    if (submission.status !== "pending") {
      console.log("[approveSubmission] Submission already processed:", submission.status)
      return { success: false, error: "Submission already processed" }
    }

    console.log("[approveSubmission] Updating status to approved...")

    // Update status first
    await db
      .update(contentSubmissions)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: null,
      })
      .where(eq(contentSubmissions.id, submissionId))

    console.log("[approveSubmission] Status updated, now publishing content...")

    // Publish content to movies/series
    const publishResult = await publishSubmissionContent(submissionId)
    console.log("[approveSubmission] Publish result:", publishResult)

    if (!publishResult.success) {
      console.log("[approveSubmission] Publishing failed, reverting status...")
      // Revert the status if publishing failed
      await db
        .update(contentSubmissions)
        .set({
          status: "pending",
          reviewedAt: null,
          reviewedBy: null,
        })
        .where(eq(contentSubmissions.id, submissionId))

      return { success: false, error: publishResult.error || "Failed to publish content" }
    }

    // Get creator profile for notification
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, submission.creatorId))
      .limit(1)

    // Send notification to creator
    if (profile) {
      console.log("[approveSubmission] Sending notification to creator...")
      await db.insert(creatorNotifications).values({
        userId: profile.userId,
        type: "submission_approved",
        title: "Content Approved!",
        message: `Your ${submission.type} "${submission.title}" has been approved and is now live!`,
      })
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/creator")
    revalidatePath("/home")
    revalidatePath("/movies")
    revalidatePath("/series")

    console.log("[approveSubmission] Approval complete!")
    return { success: true }
  } catch (error: any) {
    console.error("[approveSubmission] Error:", error)
    return { success: false, error: error.message || "Failed to approve submission" }
  }
}

// Reject content submission
export async function rejectSubmission(submissionId: string, _adminUserId?: string, reason?: string) {
  try {
    console.log("[rejectSubmission] Starting rejection for:", submissionId)

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      console.log("[rejectSubmission] Submission not found")
      return { success: false, error: "Submission not found" }
    }

    console.log("[rejectSubmission] Found submission:", submission.title)

    await db
      .update(contentSubmissions)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: null,
        rejectionReason: reason || "Rejected by admin",
      })
      .where(eq(contentSubmissions.id, submissionId))

    console.log("[rejectSubmission] Status updated to rejected")

    // Get creator for notification
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, submission.creatorId))
      .limit(1)

    if (profile) {
      console.log("[rejectSubmission] Sending notification to creator...")
      await db.insert(creatorNotifications).values({
        userId: profile.userId,
        type: "submission_rejected",
        title: "Content Rejected",
        message: `Your ${submission.type} "${submission.title}" was not approved. Reason: ${reason || "Rejected by admin"}`,
        submissionId,
      })
    }

    revalidatePath("/admin/dashboard")
    console.log("[rejectSubmission] Rejection complete!")
    return { success: true }
  } catch (error: any) {
    console.error("[rejectSubmission] Error:", error)
    return { success: false, error: error.message || "Failed to reject submission" }
  }
}

// Get all creators for admin
export async function getAllCreators() {
  try {
    const creators = await db
      .select({
        id: creatorProfiles.id,
        userId: creatorProfiles.userId,
        status: creatorProfiles.status,
        totalUploads: creatorProfiles.totalUploads,
        totalViews: creatorProfiles.totalViews,
        dailyUploadLimit: creatorProfiles.dailyUploadLimit,
        dailyStorageLimitGb: creatorProfiles.dailyStorageLimitGb,
        isAutoApproveEnabled: creatorProfiles.isAutoApproveEnabled,
        createdAt: creatorProfiles.createdAt,
        suspendedReason: creatorProfiles.suspendedReason,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(creatorProfiles)
      .innerJoin(users, eq(creatorProfiles.userId, users.id))
      .orderBy(desc(creatorProfiles.createdAt))

    // Get strike counts
    const creatorsWithStrikes = await Promise.all(
      creators.map(async (c) => {
        const [strikeCount] = await db
          .select({ count: count() })
          .from(creatorStrikes)
          .where(eq(creatorStrikes.creatorId, c.id))

        return {
          ...c,
          strikeCount: strikeCount?.count || 0,
        }
      }),
    )

    return { success: true, creators: creatorsWithStrikes }
  } catch (error) {
    console.error("Error getting creators:", error)
    return { success: false, error: "Failed to get creators" }
  }
}

// Update creator limits
export async function updateCreatorLimits(
  creatorId: string,
  data: {
    dailyUploadLimit?: number
    dailyStorageLimitGb?: number
    isAutoApproveEnabled?: boolean
  },
) {
  try {
    await db
      .update(creatorProfiles)
      .set({
        dailyUploadLimit: data.dailyUploadLimit,
        dailyStorageLimitGb: data.dailyStorageLimitGb?.toString(),
        isAutoApproveEnabled: data.isAutoApproveEnabled,
      })
      .where(eq(creatorProfiles.id, creatorId))

    // Get user for notification
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, creatorId)).limit(1)

    if (profile) {
      await db.insert(creatorNotifications).values({
        userId: profile.userId,
        type: "limit_increased",
        title: "Limits Updated",
        message: "Your upload limits have been updated by an administrator.",
      })
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating creator limits:", error)
    return { success: false, error: "Failed to update limits" }
  }
}

// Suspend creator
export async function suspendCreator(creatorId: string, reason: string) {
  try {
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, creatorId)).limit(1)

    if (!profile) {
      return { success: false, error: "Creator not found" }
    }

    await db
      .update(creatorProfiles)
      .set({
        status: "suspended",
        suspendedReason: reason,
      })
      .where(eq(creatorProfiles.id, creatorId))

    await db.insert(creatorNotifications).values({
      userId: profile.userId,
      type: "system",
      title: "Account Suspended",
      message: `Your creator account has been suspended. Reason: ${reason}`,
    })

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error suspending creator:", error)
    return { success: false, error: "Failed to suspend creator" }
  }
}

// Unsuspend creator
export async function unsuspendCreator(creatorId: string) {
  try {
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, creatorId)).limit(1)

    if (!profile) {
      return { success: false, error: "Creator not found" }
    }

    await db.delete(creatorStrikes).where(eq(creatorStrikes.creatorId, creatorId))

    await db
      .update(creatorProfiles)
      .set({
        status: "active",
        suspendedReason: null,
      })
      .where(eq(creatorProfiles.id, creatorId))

    await db.insert(creatorNotifications).values({
      userId: profile.userId,
      type: "system",
      title: "Account Reinstated",
      message:
        "Your creator account has been reinstated and all previous strikes have been cleared. You can now upload content again.",
    })

    revalidatePath("/admin/dashboard")
    revalidatePath("/creator")
    return { success: true }
  } catch (error) {
    console.error("Error unsuspending creator:", error)
    return { success: false, error: "Failed to unsuspend creator" }
  }
}

// Add strike to creator
export async function addCreatorStrike(creatorId: string, reason: string, adminUserId: string) {
  try {
    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, creatorId)).limit(1)

    if (!profile) {
      return { success: false, error: "Creator not found" }
    }

    await db.insert(creatorStrikes).values({
      creatorId,
      reason,
      issuedBy: null,
    })

    // Get strike count
    const [strikeCount] = await db
      .select({ count: count() })
      .from(creatorStrikes)
      .where(eq(creatorStrikes.creatorId, creatorId))

    const totalStrikes = strikeCount?.count || 0

    // Get settings for max strikes
    const [settings] = await db.select().from(creatorSettings).limit(1)
    const maxStrikes = settings?.maxStrikesBeforeSuspension || 3

    // Auto-suspend if max strikes reached
    if (totalStrikes >= maxStrikes) {
      await db
        .update(creatorProfiles)
        .set({
          status: "suspended",
          suspendedReason: `Automatically suspended after ${maxStrikes} strikes`,
        })
        .where(eq(creatorProfiles.id, creatorId))
    }

    await db.insert(creatorNotifications).values({
      userId: profile.userId,
      type: "strike_received",
      title: "Strike Issued",
      message: `You have received a strike on your creator account. Reason: ${reason}. Total strikes: ${totalStrikes}/${maxStrikes}`,
    })

    revalidatePath("/admin/dashboard")
    return { success: true, totalStrikes }
  } catch (error) {
    console.error("Error adding strike:", error)
    return { success: false, error: "Failed to add strike" }
  }
}

// Get all content submissions for admin
export async function getContentSubmissions(status?: string) {
  try {
    const submissions = await db
      .select({
        id: contentSubmissions.id,
        type: contentSubmissions.type,
        title: contentSubmissions.title,
        description: contentSubmissions.description,
        genre: contentSubmissions.genre,
        year: contentSubmissions.year,
        videoUrl: contentSubmissions.videoUrl,
        thumbnailUrl: contentSubmissions.thumbnailUrl,
        status: contentSubmissions.status,
        rejectionReason: contentSubmissions.rejectionReason,
        submittedAt: contentSubmissions.submittedAt,
        reviewedAt: contentSubmissions.reviewedAt,
        viewsCount: contentSubmissions.viewsCount,
        creatorId: contentSubmissions.creatorId,
      })
      .from(contentSubmissions)
      .orderBy(desc(contentSubmissions.submittedAt))

    // Get creator info for each submission
    const submissionsWithCreator = await Promise.all(
      submissions.map(async (s) => {
        const [profile] = await db
          .select({
            id: creatorProfiles.id,
            user: {
              email: users.email,
              username: users.username,
              firstName: users.firstName,
            },
          })
          .from(creatorProfiles)
          .innerJoin(users, eq(creatorProfiles.userId, users.id))
          .where(eq(creatorProfiles.id, s.creatorId))
          .limit(1)

        return {
          ...s,
          creator: profile?.user || null,
        }
      }),
    )

    if (status && status !== "all") {
      return { success: true, submissions: submissionsWithCreator.filter((s) => s.status === status) }
    }

    return { success: true, submissions: submissionsWithCreator }
  } catch (error) {
    console.error("Error getting submissions:", error)
    return { success: false, error: "Failed to get submissions" }
  }
}

// Publish submission content to main site
async function publishSubmissionContent(submissionId: string) {
  try {
    console.log("[publishSubmissionContent] Called for:", submissionId)

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    console.log("[publishSubmissionContent] Submission data:", {
      type: submission.type,
      title: submission.title,
      genre: submission.genre,
      thumbnailUrl: submission.thumbnailUrl,
      videoUrl: submission.videoUrl,
    })

    // Generate unique slug
    const baseSlug = generateSlug(submission.title)
    let slug = baseSlug
    let counter = 1

    if (submission.type === "movie") {
      // Check for existing movie with same slug
      while (true) {
        const [existing] = await db.select({ id: movies.id }).from(movies).where(eq(movies.slug, slug)).limit(1)
        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Also check for duplicate title
      let finalTitle = submission.title
      let titleCounter = 1
      while (true) {
        const [existingTitle] = await db
          .select({ id: movies.id })
          .from(movies)
          .where(eq(movies.title, finalTitle))
          .limit(1)
        if (!existingTitle) break
        finalTitle = `${submission.title} (${titleCounter})`
        titleCounter++
      }

      console.log("[publishSubmissionContent] Creating movie with slug:", slug, "title:", finalTitle)

      const [newMovie] = await db
        .insert(movies)
        .values({
          title: finalTitle,
          slug,
          description: submission.description || "No description available",
          genre: submission.genre || "Drama",
          year: submission.year || new Date().getFullYear(),
          posterUrl: submission.thumbnailUrl || "/abstract-movie-poster.png",
          videoUrl: submission.videoUrl || "",
          isFeatured: false,
          isTrending: false,
          isTop: false,
          views: 0,
        })
        .returning({ id: movies.id })

      console.log("[publishSubmissionContent] Movie created with ID:", newMovie?.id)

      // Update submission with published movie ID
      await db
        .update(contentSubmissions)
        .set({ publishedMovieId: newMovie.id })
        .where(eq(contentSubmissions.id, submissionId))

      return { success: true, movieId: newMovie.id }
    } else {
      // Series
      // Check for existing series with same slug
      while (true) {
        const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.slug, slug)).limit(1)
        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Check for duplicate title
      let finalTitle = submission.title
      let titleCounter = 1
      while (true) {
        const [existingTitle] = await db
          .select({ id: series.id })
          .from(series)
          .where(eq(series.title, finalTitle))
          .limit(1)
        if (!existingTitle) break
        finalTitle = `${submission.title} (${titleCounter})`
        titleCounter++
      }

      console.log("[publishSubmissionContent] Creating series with slug:", slug, "title:", finalTitle)

      const seriesData = submission.seriesData ? JSON.parse(submission.seriesData) : { totalSeasons: 1 }

      const [newSeries] = await db
        .insert(series)
        .values({
          title: finalTitle,
          slug,
          description: submission.description || "No description available",
          genre: submission.genre || "Drama",
          releaseYear: submission.year || new Date().getFullYear(),
          totalSeasons: seriesData.totalSeasons || 1,
          totalEpisodes: 0, // Will be updated after episodes are added
          status: seriesData.status || "ongoing",
          posterUrl: submission.thumbnailUrl || "/series-poster.jpg",
          bannerUrl: submission.bannerUrl || submission.thumbnailUrl || "",
          isFeatured: false,
          isTrending: false,
          views: 0,
        })
        .returning({ id: series.id })

      console.log("[publishSubmissionContent] Series created with ID:", newSeries?.id)

      // Get submission episodes
      const subEpisodes = await db
        .select()
        .from(submissionEpisodes)
        .where(eq(submissionEpisodes.submissionId, submissionId))
        .orderBy(submissionEpisodes.seasonNumber, submissionEpisodes.episodeNumber)

      console.log("[publishSubmissionContent] Found", subEpisodes.length, "episodes to publish")

      // Group episodes by season
      const seasonMap = new Map<number, typeof subEpisodes>()
      for (const ep of subEpisodes) {
        if (!seasonMap.has(ep.seasonNumber)) {
          seasonMap.set(ep.seasonNumber, [])
        }
        seasonMap.get(ep.seasonNumber)!.push(ep)
      }

      let totalEpisodesCount = 0

      // Create seasons and episodes
      for (const [seasonNum, seasonEpisodes] of seasonMap) {
        console.log("[publishSubmissionContent] Creating season", seasonNum, "with", seasonEpisodes.length, "episodes")

        const [newSeason] = await db
          .insert(seasons)
          .values({
            seriesId: newSeries.id,
            seasonNumber: seasonNum,
            totalEpisodes: seasonEpisodes.length,
          })
          .returning({ id: seasons.id })

        for (const ep of seasonEpisodes) {
          await db.insert(episodes).values({
            seasonId: newSeason.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description || "",
            duration: ep.duration || 45,
            videoUrl: ep.videoUrl,
            thumbnailUrl: ep.thumbnailUrl || submission.thumbnailUrl || "",
          })
          totalEpisodesCount++
        }
      }

      // Update series total episodes count
      await db
        .update(series)
        .set({ totalEpisodes: totalEpisodesCount, totalSeasons: seasonMap.size })
        .where(eq(series.id, newSeries.id))

      // Update submission with published series ID
      await db
        .update(contentSubmissions)
        .set({ publishedSeriesId: newSeries.id })
        .where(eq(contentSubmissions.id, submissionId))

      return { success: true, seriesId: newSeries.id }
    }
  } catch (error: any) {
    console.error("[publishSubmissionContent] Error:", error)
    return { success: false, error: error.message || "Failed to publish content" }
  }
}

// Get creator stats for admin overview
export async function getCreatorStats() {
  try {
    const [totalCreators] = await db.select({ count: count() }).from(creatorProfiles)

    const [activeCreators] = await db
      .select({ count: count() })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.status, "active"))

    const [pendingRequests] = await db
      .select({ count: count() })
      .from(creatorRequests)
      .where(eq(creatorRequests.status, "pending"))

    const [pendingSubmissions] = await db
      .select({ count: count() })
      .from(contentSubmissions)
      .where(eq(contentSubmissions.status, "pending"))

    const [totalSubmissions] = await db.select({ count: count() }).from(contentSubmissions)

    const [approvedToday] = await db
      .select({ count: count() })
      .from(contentSubmissions)
      .where(
        and(
          eq(contentSubmissions.status, "approved"),
          gte(contentSubmissions.reviewedAt, new Date(new Date().setHours(0, 0, 0, 0))),
        ),
      )

    return {
      success: true,
      stats: {
        totalCreators: totalCreators?.count || 0,
        activeCreators: activeCreators?.count || 0,
        pendingRequests: pendingRequests?.count || 0,
        pendingSubmissions: pendingSubmissions?.count || 0,
        totalSubmissions: totalSubmissions?.count || 0,
        approvedToday: approvedToday?.count || 0,
      },
    }
  } catch (error) {
    console.error("Error getting creator stats:", error)
    return { success: false, error: "Failed to get stats" }
  }
}

// Get creator settings
export async function getCreatorSettings() {
  try {
    let [settings] = await db.select().from(creatorSettings).limit(1)

    if (!settings) {
      // Create default settings
      const [newSettings] = await db
        .insert(creatorSettings)
        .values({
          minAccountAgeDays: 30,
          maxAccountAgeDays: 90,
          defaultDailyUploadLimit: 4,
          defaultDailyStorageLimitGb: "8",
          autoApproveNewCreators: false,
          maxStrikesBeforeSuspension: 3,
          isCreatorSystemEnabled: true,
        })
        .returning()
      settings = newSettings
    }

    return { success: true, settings }
  } catch (error) {
    console.error("Error getting creator settings:", error)
    return { success: false, error: "Failed to get settings" }
  }
}

// Update creator settings
export async function updateCreatorSettings(data: {
  minAccountAgeDays?: number
  maxAccountAgeDays?: number
  defaultDailyUploadLimit?: number
  defaultDailyStorageLimitGb?: number
  autoApproveNewCreators?: boolean
  maxStrikesBeforeSuspension?: number
  isCreatorSystemEnabled?: boolean
}) {
  try {
    const [existing] = await db.select().from(creatorSettings).limit(1)

    if (existing) {
      await db
        .update(creatorSettings)
        .set({
          ...data,
          defaultDailyStorageLimitGb: data.defaultDailyStorageLimitGb?.toString(),
        })
        .where(eq(creatorSettings.id, existing.id))
    } else {
      await db.insert(creatorSettings).values({
        ...data,
        defaultDailyStorageLimitGb: data.defaultDailyStorageLimitGb?.toString() || "8",
      })
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating creator settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
