import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorChargeback, payoutRequests, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const chargebacks = await db
      .select({
        id: creatorChargeback.id,
        userId: creatorChargeback.userId,
        userName: users.username,
        payoutRequestId: creatorChargeback.payoutRequestId,
        amountUSD: creatorChargeback.amountUSD,
        reason: creatorChargeback.reason,
        status: creatorChargeback.status,
        initiatedAt: creatorChargeback.initiatedAt,
        completedAt: creatorChargeback.completedAt,
      })
      .from(creatorChargeback)
      .leftJoin(users, eq(creatorChargeback.userId, users.id))
      .orderBy(desc(creatorChargeback.initiatedAt))

    return NextResponse.json({ chargebacks })
  } catch (error) {
    console.error("Error fetching chargebacks:", error)
    return NextResponse.json({ error: "Failed to fetch chargebacks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, payoutRequestId, amountUSD, reason } = body

    // Create chargeback
    const [chargeback] = await db
      .insert(creatorChargeback)
      .values({
        userId: targetUserId,
        payoutRequestId,
        amountUSD: amountUSD.toString(),
        reason,
        initiatedBy: userId,
        status: "pending",
      })
      .returning()

    // Deduct amount from creator's balance
    await db.execute(sql`
      UPDATE "CreatorPayoutSetting"
      SET "currentBalance" = "currentBalance" - ${amountUSD}
      WHERE "userId" = ${targetUserId}
    `)

    // Update payout request status to "charged_back"
    await db.update(payoutRequests).set({ status: "charged_back" }).where(eq(payoutRequests.id, payoutRequestId))

    // Update chargeback status to completed
    await db
      .update(creatorChargeback)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(creatorChargeback.id, chargeback.id))

    return NextResponse.json({ chargeback })
  } catch (error) {
    console.error("Error processing chargeback:", error)
    return NextResponse.json({ error: "Failed to process chargeback" }, { status: 500 })
  }
}
