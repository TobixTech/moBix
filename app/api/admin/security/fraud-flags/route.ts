import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorFraudFlag, users } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"

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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const severity = searchParams.get("severity")

    const conditions = []
    if (status) conditions.push(eq(creatorFraudFlag.status, status))
    if (severity) conditions.push(eq(creatorFraudFlag.severity, severity))

    const flags = await db
      .select({
        id: creatorFraudFlag.id,
        userId: creatorFraudFlag.userId,
        userName: users.username,
        userEmail: users.email,
        flagType: creatorFraudFlag.flagType,
        severity: creatorFraudFlag.severity,
        description: creatorFraudFlag.description,
        evidence: creatorFraudFlag.evidence,
        status: creatorFraudFlag.status,
        createdAt: creatorFraudFlag.createdAt,
        resolvedAt: creatorFraudFlag.resolvedAt,
        actionTaken: creatorFraudFlag.actionTaken,
      })
      .from(creatorFraudFlag)
      .leftJoin(users, eq(creatorFraudFlag.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(creatorFraudFlag.createdAt))

    return NextResponse.json({ flags })
  } catch (error) {
    console.error("Error fetching fraud flags:", error)
    return NextResponse.json({ error: "Failed to fetch fraud flags" }, { status: 500 })
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
    const { targetUserId, flagType, severity, description, evidence } = body

    const [flag] = await db
      .insert(creatorFraudFlag)
      .values({
        userId: targetUserId,
        flagType,
        severity,
        description,
        evidence: JSON.stringify(evidence || {}),
        status: "pending",
      })
      .returning()

    return NextResponse.json({ flag })
  } catch (error) {
    console.error("Error creating fraud flag:", error)
    return NextResponse.json({ error: "Failed to create fraud flag" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { flagId, status, actionTaken } = body

    const [updated] = await db
      .update(creatorFraudFlag)
      .set({
        status,
        actionTaken,
        resolvedAt: status === "resolved" || status === "confirmed" ? new Date() : undefined,
        resolvedBy: userId,
      })
      .where(eq(creatorFraudFlag.id, flagId))
      .returning()

    return NextResponse.json({ flag: updated })
  } catch (error) {
    console.error("Error updating fraud flag:", error)
    return NextResponse.json({ error: "Failed to update fraud flag" }, { status: 500 })
  }
}
