import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { targetedPromotions, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const dynamic = "force-dynamic"

// Get targeted promotions for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Check if user has a pending targeted promotion
    const targeted = await db.query.targetedPromotions.findFirst({
      where: and(
        eq(targetedPromotions.userId, userId),
        eq(targetedPromotions.shown, false),
        eq(targetedPromotions.dismissed, false),
      ),
    })

    if (targeted) {
      return NextResponse.json({
        hasTargetedPromotion: true,
        promotion: {
          ...targeted,
          createdAt: targeted.createdAt.toISOString(),
        },
      })
    }

    return NextResponse.json({ hasTargetedPromotion: false })
  } catch (error) {
    console.error("Error checking targeted promotion:", error)
    return NextResponse.json({ error: "Failed to check" }, { status: 500 })
  }
}

// Create a targeted promotion for a user
export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create targeted promotion
    const [targeted] = await db
      .insert(targetedPromotions)
      .values({
        userId,
        reason: reason || "Manual selection by admin",
      })
      .returning()

    return NextResponse.json({ success: true, promotion: targeted })
  } catch (error) {
    console.error("Error creating targeted promotion:", error)
    return NextResponse.json({ success: false, error: "Failed to create" }, { status: 500 })
  }
}

// Mark targeted promotion as shown or dismissed
export async function PATCH(req: NextRequest) {
  try {
    const { promotionId, action } = await req.json()

    if (!promotionId || !action) {
      return NextResponse.json({ error: "Missing promotionId or action" }, { status: 400 })
    }

    if (action === "shown") {
      await db
        .update(targetedPromotions)
        .set({ shown: true, shownAt: new Date() })
        .where(eq(targetedPromotions.id, promotionId))
    } else if (action === "dismissed") {
      await db.update(targetedPromotions).set({ dismissed: true }).where(eq(targetedPromotions.id, promotionId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating targeted promotion:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
