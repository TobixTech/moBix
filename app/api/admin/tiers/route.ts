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

    // Get tier upgrade requests
    const requests = await sql`
      SELECT 
        ct.*,
        u.email,
        u.username,
        cp.name as creatorName,
        cp.profileImage,
        (SELECT COUNT(*) FROM creatorEarnings WHERE userId = ct.userId) as totalViews
      FROM creatorTiers ct
      JOIN users u ON u.clerkId = ct.userId
      LEFT JOIN creatorProfiles cp ON cp.userId = ct.userId
      WHERE ct.requestedAt IS NOT NULL AND ct.approvedAt IS NULL
      ORDER BY ct.requestedAt DESC
    `

    return Response.json({ requests })
  } catch (error) {
    console.error("Get tier requests error:", error)
    return Response.json({ error: "Failed to fetch tier requests" }, { status: 500 })
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

    const { creatorUserId, action, newTier } = await request.json()

    if (action === "approve") {
      // Get current tier
      const [currentTier] = await sql`
        SELECT * FROM creatorTiers WHERE userId = ${creatorUserId}
      `

      // Determine new tier and rate
      const tierLevel = newTier
      let ratePerView = 0.0008

      switch (tierLevel) {
        case "silver":
          ratePerView = 0.005
          break
        case "gold":
          ratePerView = 0.01
          break
        case "platinum":
          ratePerView = 0.025
          break
      }

      // Update tier
      await sql`
        UPDATE creatorTiers
        SET 
          tierLevel = ${tierLevel},
          ratePerView = ${ratePerView},
          approvedAt = NOW(),
          approvedBy = ${userId},
          upgradedAt = NOW()
        WHERE userId = ${creatorUserId}
      `

      return Response.json({
        success: true,
        message: `Tier upgraded to ${tierLevel}. New rate: $${ratePerView}/view`,
      })
    } else if (action === "deny") {
      // Reset request
      await sql`
        UPDATE creatorTiers
        SET requestedAt = NULL
        WHERE userId = ${creatorUserId}
      `

      return Response.json({
        success: true,
        message: "Tier upgrade request denied",
      })
    } else if (action === "manual-adjust") {
      // Manual tier adjustment
      let ratePerView = 0.0008

      switch (newTier) {
        case "silver":
          ratePerView = 0.005
          break
        case "gold":
          ratePerView = 0.01
          break
        case "platinum":
          ratePerView = 0.025
          break
      }

      await sql`
        UPDATE creatorTiers
        SET 
          tierLevel = ${newTier},
          ratePerView = ${ratePerView},
          approvedAt = NOW(),
          approvedBy = ${userId},
          upgradedAt = NOW()
        WHERE userId = ${creatorUserId}
      `

      return Response.json({
        success: true,
        message: `Tier manually adjusted to ${newTier}`,
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Process tier action error:", error)
    return Response.json({ error: "Failed to process tier action" }, { status: 500 })
  }
}
