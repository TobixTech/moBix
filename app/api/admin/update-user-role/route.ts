import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await req.json()

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: "Missing userId or role" }, { status: 400 })
    }

    const allowedRoles = ["USER", "PREMIUM"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Only USER and PREMIUM are allowed." },
        { status: 400 },
      )
    }

    await db.update(users).set({ role }).where(eq(users.clerkId, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 })
  }
}
