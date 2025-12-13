import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [admin] = await sql`
      SELECT role FROM "User" WHERE "clerkId" = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const offers = await sql`
      SELECT 
        co.*,
        u.username as "createdByName",
        (SELECT COUNT(*) FROM "CreatorOfferRedemption" WHERE "offerId" = co.id) as "redemptionCount"
      FROM "CreatorOffer" co
      LEFT JOIN "User" u ON u."clerkId" = co."createdBy"
      ORDER BY co."createdAt" DESC
    `

    return Response.json({ offers })
  } catch (error) {
    console.error("Get admin offers error:", error)
    return Response.json({ error: "Failed to fetch offers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [admin] = await sql`
      SELECT role FROM "User" WHERE "clerkId" = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const { action, offerId, offerData, targetUserId, bonusAmount, bonusReason } = await request.json()

    if (action === "create") {
      const { offerType, title, description, bonusAmount, multiplier, conditions, expiresAt } = offerData

      await sql`
        INSERT INTO "CreatorOffer" (
          "offerType", title, description, "bonusAmount", multiplier, 
          conditions, "expiresAt", "isActive", "createdAt", "createdBy"
        ) VALUES (
          ${offerType}, ${title}, ${description}, ${bonusAmount || null}, ${multiplier || null},
          ${JSON.stringify(conditions)}, ${expiresAt || null}, true, NOW(), ${userId}
        )
      `

      return Response.json({
        success: true,
        message: "Offer created successfully",
      })
    } else if (action === "toggle") {
      await sql`
        UPDATE "CreatorOffer"
        SET "isActive" = NOT "isActive"
        WHERE id = ${offerId}
      `

      return Response.json({
        success: true,
        message: "Offer status updated",
      })
    } else if (action === "delete") {
      await sql`
        DELETE FROM "CreatorOffer" WHERE id = ${offerId}
      `

      return Response.json({
        success: true,
        message: "Offer deleted",
      })
    } else if (action === "send-bonus") {
      const [targetUser] = await sql`
        SELECT id FROM "User" WHERE "clerkId" = ${targetUserId}
      `

      if (!targetUser) {
        return Response.json({ error: "User not found" }, { status: 404 })
      }

      // Send bonus to specific creator
      await sql`
        INSERT INTO "CreatorBonus" ("userId", "bonusType", amount, reason, "appliedBy", "appliedAt")
        VALUES (${targetUser.id}, 'custom', ${bonusAmount}, ${bonusReason}, ${userId}, NOW())
      `

      return Response.json({
        success: true,
        message: `Bonus of $${bonusAmount} sent successfully`,
      })
    } else if (action === "mass-bonus") {
      const creators = await sql`
        SELECT DISTINCT cp."userId"
        FROM "CreatorProfile" cp
        WHERE cp.status = 'active'
      `

      for (const creator of creators) {
        await sql`
          INSERT INTO "CreatorBonus" ("userId", "bonusType", amount, reason, "appliedBy", "appliedAt")
          VALUES (${creator.userId}, 'mass', ${bonusAmount}, ${bonusReason}, ${userId}, NOW())
        `
      }

      return Response.json({
        success: true,
        message: `Bonus of $${bonusAmount} sent to ${creators.length} creators`,
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin offer action error:", error)
    return Response.json({ error: "Failed to process action" }, { status: 500 })
  }
}
