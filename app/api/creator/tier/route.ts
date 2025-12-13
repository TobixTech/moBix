import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current tier info
    const [tier] = await sql`
      SELECT 
        ct.*,
        (SELECT COUNT(*) FROM creatorEarnings WHERE userId = ${userId}) as totalViews
      FROM creatorTiers ct
      WHERE ct.userId = ${userId}
    `

    if (!tier) {
      // Create default bronze tier
      const [newTier] = await sql`
        INSERT INTO creatorTiers (userId, tierLevel, totalViews, ratePerView, upgradedAt)
        VALUES (${userId}, 'bronze', 0, 0.0008, NOW())
        RETURNING *
      `
      return Response.json({ tier: newTier })
    }

    // Calculate next tier info
    let nextTier = null
    let viewsNeeded = 0

    if (tier.tierLevel === "bronze" && tier.totalViews >= 10000) {
      nextTier = "silver"
      viewsNeeded = 0
    } else if (tier.tierLevel === "bronze") {
      nextTier = "silver"
      viewsNeeded = 10000 - tier.totalViews
    } else if (tier.tierLevel === "silver" && tier.totalViews >= 50000) {
      nextTier = "gold"
      viewsNeeded = 0
    } else if (tier.tierLevel === "silver") {
      nextTier = "gold"
      viewsNeeded = 50000 - tier.totalViews
    } else if (tier.tierLevel === "gold" && tier.totalViews >= 200000) {
      nextTier = "platinum"
      viewsNeeded = 0
    } else if (tier.tierLevel === "gold") {
      nextTier = "platinum"
      viewsNeeded = 200000 - tier.totalViews
    }

    return Response.json({
      tier,
      nextTier,
      viewsNeeded,
      canRequestUpgrade: viewsNeeded === 0 && nextTier !== null,
    })
  } catch (error) {
    console.error("Get tier error:", error)
    return Response.json({ error: "Failed to fetch tier info" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === "request-upgrade") {
      // Get current tier
      const [tier] = await sql`
        SELECT * FROM creatorTiers WHERE userId = ${userId}
      `

      if (!tier) {
        return Response.json({ error: "Tier not found" }, { status: 404 })
      }

      // Check if already has pending request
      const [pending] = await sql`
        SELECT id FROM creatorTiers 
        WHERE userId = ${userId} 
        AND requestedAt IS NOT NULL 
        AND approvedAt IS NULL
      `

      if (pending) {
        return Response.json({ error: "You already have a pending tier upgrade request" }, { status: 400 })
      }

      // Update tier with request timestamp
      await sql`
        UPDATE creatorTiers
        SET requestedAt = NOW()
        WHERE userId = ${userId}
      `

      return Response.json({
        success: true,
        message: "Tier upgrade request submitted. Awaiting admin approval.",
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Tier action error:", error)
    return Response.json({ error: "Failed to process tier action" }, { status: 500 })
  }
}
