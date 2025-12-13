import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const [admin] = await sql`
      SELECT role FROM users WHERE clerkId = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all offers
    const offers = await sql`
      SELECT 
        co.*,
        u.username as createdByName,
        (SELECT COUNT(*) FROM creatorOfferRedemptions WHERE offerId = co.id) as redemptionCount
      FROM creatorOffers co
      LEFT JOIN users u ON u.clerkId = co.createdBy
      ORDER BY co.createdAt DESC
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

    // Check if user is admin
    const [admin] = await sql`
      SELECT role FROM users WHERE clerkId = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const { action, offerId, offerData, targetUserId, bonusAmount, bonusReason } = await request.json()

    if (action === "create") {
      const { offerType, title, description, bonusAmount, multiplier, conditions, expiresAt } = offerData

      await sql`
        INSERT INTO creatorOffers (
          offerType, title, description, bonusAmount, multiplier, 
          conditions, expiresAt, isActive, createdAt, createdBy
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
        UPDATE creatorOffers
        SET isActive = NOT isActive
        WHERE id = ${offerId}
      `

      return Response.json({
        success: true,
        message: "Offer status updated",
      })
    } else if (action === "delete") {
      await sql`
        DELETE FROM creatorOffers WHERE id = ${offerId}
      `

      return Response.json({
        success: true,
        message: "Offer deleted",
      })
    } else if (action === "send-bonus") {
      // Send bonus to specific creator
      await sql`
        INSERT INTO creatorBonuses (userId, bonusType, amount, reason, appliedBy, appliedAt)
        VALUES (${targetUserId}, 'custom', ${bonusAmount}, ${bonusReason}, ${userId}, NOW())
      `

      return Response.json({
        success: true,
        message: `Bonus of $${bonusAmount} sent successfully`,
      })
    } else if (action === "mass-bonus") {
      // Send bonus to all creators
      const creators = await sql`
        SELECT clerkId FROM users WHERE role = 'creator'
      `

      for (const creator of creators) {
        await sql`
          INSERT INTO creatorBonuses (userId, bonusType, amount, reason, appliedBy, appliedAt)
          VALUES (${creator.clerkId}, 'mass', ${bonusAmount}, ${bonusReason}, ${userId}, NOW())
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
