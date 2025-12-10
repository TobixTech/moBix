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
import { eq, desc, and, count, gte, sql } from "drizzle-orm"
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
      .innerJoin(users, eq(creatorRequests.userId, users.id))
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
export async function approveCreatorRequest(requestId: string, adminUserId: string) {
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
        reviewedBy: adminUserId,
      })
      .where(eq(creatorRequests.id, requestId))

    // Create creator profile
    await db.insert(creatorProfiles).values({
      userId: request.userId,
      dailyUploadLimit: settings?.defaultDailyUploadLimit || 4,
      dailyStorageLimitGb: settings?.defaultDailyStorageLimitGb?.toString() || "8",
      isAutoApproveEnabled: false,
    })

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
export async function rejectCreatorRequest(requestId: string, adminUserId: string, reason: string) {
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
        reviewedBy: adminUserId,
        rejectionReason: reason,
      })
      .where(eq(creatorRequests.id, requestId))

    // Create notification for user
    await db.insert(creatorNotifications).values({
      userId: request.userId,
      type: "system",
      title: "Creator Access Request Rejected",
      message: `Your creator access request was not approved. Reason: ${reason}`,
    })

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting creator request:", error)
    return { success: false, error: "Failed to reject request" }
  }
}

// Grant creator access manually (bypass eligibility)
export async function grantCreatorAccess(userEmail: string, adminUserId: string) {
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

    // Get creator settings
    const [settings] = await db.select().from(creatorSettings).limit(1)

    // Create creator profile
    await db.insert(creatorProfiles).values({
      userId: user.id,
      dailyUploadLimit: settings?.defaultDailyUploadLimit || 4,
      dailyStorageLimitGb: settings?.defaultDailyStorageLimitGb?.toString() || "8",
      isAutoApproveEnabled: false,
    })

    // Create notification
    await db.insert(creatorNotifications).values({
      userId: user.id,
      type: "system",
      title: "Creator Access Granted!",
      message: "You have been granted creator access by an administrator. Start uploading your content now!",
    })

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error granting creator access:", error)
    return { success: false, error: "Failed to grant creator access" }
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
      message: "Your creator account has been reinstated. You can now upload content again.",
    })

    revalidatePath("/admin/dashboard")
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
      issuedBy: adminUserId,
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

// Approve content submission
export async function approveSubmission(submissionId: string, adminUserId: string) {
  try {
    console.log("[approveSubmission] Starting approval for:", submissionId)

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      console.error("[approveSubmission] Submission not found:", submissionId)
      return { success: false, error: "Submission not found" }
    }

    console.log("[approveSubmission] Found submission:", submission.title, submission.status)

    if (submission.status !== "pending") {
      return { success: false, error: "Submission already processed" }
    }

    // Update submission status first
    await db
      .update(contentSubmissions)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
      })
      .where(eq(contentSubmissions.id, submissionId))

    console.log("[approveSubmission] Status updated to approved")

    // Publish content to main site
    const publishResult = await publishSubmissionContent(submissionId)

    if (!publishResult.success) {
      console.error("[approveSubmission] Publish failed:", publishResult.error)
      // Revert status if publish fails
      await db
        .update(contentSubmissions)
        .set({ status: "pending", reviewedAt: null, reviewedBy: null })
        .where(eq(contentSubmissions.id, submissionId))
      return { success: false, error: publishResult.error || "Failed to publish content" }
    }

    console.log("[approveSubmission] Content published successfully")

    // Get creator for notification
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, submission.creatorId))
      .limit(1)

    if (profile) {
      await db.insert(creatorNotifications).values({
        userId: profile.userId,
        type: "submission_approved",
        title: "Content Approved!",
        message: `Your ${submission.type} "${submission.title}" has been approved and is now live on moBix!`,
        submissionId,
      })

      // Update creator's total views (initial)
      await db
        .update(creatorProfiles)
        .set({ totalViews: sql`${creatorProfiles.totalViews} + 0` })
        .where(eq(creatorProfiles.id, profile.id))
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/home")
    revalidatePath("/browse")
    revalidatePath("/movies")
    revalidatePath("/series")

    console.log("[approveSubmission] Completed successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[approveSubmission] Error:", error)
    return { success: false, error: error.message || "Failed to approve submission" }
  }
}

// Reject content submission
export async function rejectSubmission(submissionId: string, adminUserId: string, reason: string) {
  try {
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    await db
      .update(contentSubmissions)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionReason: reason,
      })
      .where(eq(contentSubmissions.id, submissionId))

    // Get creator for notification
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, submission.creatorId))
      .limit(1)

    if (profile) {
      await db.insert(creatorNotifications).values({
        userId: profile.userId,
        type: "submission_rejected",
        title: "Content Rejected",
        message: `Your ${submission.type} "${submission.title}" was not approved. Reason: ${reason}`,
        submissionId,
      })
    }

    revalidatePath("/admin/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting submission:", error)
    return { success: false, error: "Failed to reject submission" }
  }
}

// Publish submission content to main site
async function publishSubmissionContent(
  submissionId: string,
): Promise<{ success: boolean; error?: string; movieId?: string; seriesId?: string }> {
  try {
    console.log("[publishSubmissionContent] Starting for:", submissionId)

    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return { success: false, error: "Submission not found" }
    }

    console.log("[publishSubmissionContent] Publishing:", submission.type, submission.title)

    if (submission.type === "movie") {
      // Generate unique slug
      const baseSlug = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      let slug = baseSlug
      let counter = 1

      // Check for existing slug
      while (true) {
        const [existing] = await db.select({ id: movies.id }).from(movies).where(eq(movies.slug, slug)).limit(1)

        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
        if (counter > 100) {
          return { success: false, error: "Could not generate unique slug" }
        }
      }

      // Check for existing title and make unique
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
        if (titleCounter > 100) {
          return { success: false, error: "Could not generate unique title" }
        }
      }

      console.log("[publishSubmissionContent] Creating movie:", finalTitle, slug)

      const [movie] = await db
        .insert(movies)
        .values({
          title: finalTitle,
          slug,
          description: submission.description || "",
          genre: submission.genre || "Other",
          year: submission.year || new Date().getFullYear(),
          posterUrl: submission.thumbnailUrl || "",
          videoUrl: submission.videoUrl || "",
          views: 0,
          isTrending: false,
          isFeatured: false,
          isTop: false,
        })
        .returning()

      console.log("[publishSubmissionContent] Movie created:", movie.id)

      await db
        .update(contentSubmissions)
        .set({ publishedMovieId: movie.id })
        .where(eq(contentSubmissions.id, submissionId))

      return { success: true, movieId: movie.id }
    } else if (submission.type === "series") {
      // Generate unique slug
      const baseSlug = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      let slug = baseSlug
      let counter = 1

      while (true) {
        const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.slug, slug)).limit(1)

        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
        if (counter > 100) {
          return { success: false, error: "Could not generate unique slug" }
        }
      }

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
        if (titleCounter > 100) {
          return { success: false, error: "Could not generate unique title" }
        }
      }

      console.log("[publishSubmissionContent] Creating series:", finalTitle, slug)

      let seriesData: any = {}
      try {
        seriesData = submission.seriesData ? JSON.parse(submission.seriesData) : {}
      } catch (e) {
        console.error("[publishSubmissionContent] Error parsing series data:", e)
      }

      const [newSeries] = await db
        .insert(series)
        .values({
          title: finalTitle,
          slug,
          description: submission.description || "",
          genre: submission.genre || "Other",
          posterUrl: submission.thumbnailUrl || "",
          bannerUrl: submission.bannerUrl || null,
          releaseYear: submission.year || new Date().getFullYear(),
          status: seriesData.status || "ongoing",
          totalSeasons: seriesData.totalSeasons || 1,
          totalEpisodes: seriesData.totalEpisodes || 0,
          views: 0,
          isTrending: false,
          isFeatured: false,
        })
        .returning()

      console.log("[publishSubmissionContent] Series created:", newSeries.id)

      // Get submission episodes
      const subEpisodes = await db
        .select()
        .from(submissionEpisodes)
        .where(eq(submissionEpisodes.submissionId, submissionId))
        .orderBy(submissionEpisodes.seasonNumber, submissionEpisodes.episodeNumber)

      console.log("[publishSubmissionContent] Found episodes:", subEpisodes.length)

      if (subEpisodes.length > 0) {
        // Group episodes by season
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

          console.log("[publishSubmissionContent] Season created:", season.id, "Season", seasonNum)

          for (const ep of eps) {
            await db.insert(episodes).values({
              seasonId: season.id,
              episodeNumber: ep.episodeNumber,
              title: ep.title || `Episode ${ep.episodeNumber}`,
              description: ep.description || "",
              videoUrl: ep.videoUrl,
              thumbnailUrl: ep.thumbnailUrl || submission.thumbnailUrl || "",
              duration: ep.duration || 0,
            })
          }
        }

        // Update total episodes count
        await db.update(series).set({ totalEpisodes: subEpisodes.length }).where(eq(series.id, newSeries.id))
      }

      await db
        .update(contentSubmissions)
        .set({ publishedSeriesId: newSeries.id })
        .where(eq(contentSubmissions.id, submissionId))

      return { success: true, seriesId: newSeries.id }
    }

    return { success: false, error: "Unknown content type" }
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
