import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active offers for this creator
    const offers = await sql`
      SELECT 
        co.*,
        cor.id as redemptionId,
        cor.progress,
        cor.isCompleted,
        cor.redeemedAt
      FROM creatorOffers co
      LEFT JOIN creatorOfferRedemptions cor ON cor.offerId = co.id AND cor.userId = ${userId}
      WHERE co.isActive = true
      AND (co.expiresAt IS NULL OR co.expiresAt > NOW())
      ORDER BY co.createdAt DESC
    `

    // Check for automatic welcome bonuses
    const [creator] = await sql`
      SELECT createdAt FROM users WHERE clerkId = ${userId}
    `

    const [hasWelcomeBonus] = await sql`
      SELECT id FROM creatorBonuses 
      WHERE userId = ${userId} AND bonusType = 'welcome'
    `

    const [hasFirstContentBonus] = await sql`
      SELECT id FROM creatorBonuses 
      WHERE userId = ${userId} AND bonusType = 'first_content'
    `

    const [hasUploadedContent] = await sql`
      SELECT id FROM movies WHERE uploadedBy = ${userId}
      UNION ALL
      SELECT id FROM series WHERE uploadedBy = ${userId}
      LIMIT 1
    `

    return Response.json({
      offers,
      canClaimWelcome: !hasWelcomeBonus,
      canClaimFirstContent: !hasFirstContentBonus && hasUploadedContent,
    })
  } catch (error) {
    console.error("Get offers error:", error)
    return Response.json({ error: "Failed to fetch offers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, offerId } = await request.json()

    if (action === "claim-welcome") {
      // Check if already claimed
      const [existing] = await sql`
        SELECT id FROM creatorBonuses 
        WHERE userId = ${userId} AND bonusType = 'welcome'
      `

      if (existing) {
        return Response.json({ error: "Welcome bonus already claimed" }, { status: 400 })
      }

      // Add $2 bonus
      await sql`
        INSERT INTO creatorBonuses (userId, bonusType, amount, reason, appliedBy, appliedAt)
        VALUES (${userId}, 'welcome', 2, 'Welcome bonus for new creators', 'system', NOW())
      `

      return Response.json({
        success: true,
        message: "+$2 Welcome bonus added to your balance!",
      })
    } else if (action === "claim-first-content") {
      const [existing] = await sql`
        SELECT id FROM creatorBonuses 
        WHERE userId = ${userId} AND bonusType = 'first_content'
      `

      if (existing) {
        return Response.json({ error: "First content bonus already claimed" }, { status: 400 })
      }

      // Add $1 bonus
      await sql`
        INSERT INTO creatorBonuses (userId, bonusType, amount, reason, appliedBy, appliedAt)
        VALUES (${userId}, 'first_content', 1, 'First content approval bonus', 'system', NOW())
      `

      return Response.json({
        success: true,
        message: "+$1 First content bonus added to your balance!",
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Claim bonus error:", error)
    return Response.json({ error: "Failed to claim bonus" }, { status: 500 })
  }
}
