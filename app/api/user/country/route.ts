import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" })
    }

    const { country } = await req.json()
    if (!country) {
      return NextResponse.json({ success: false, error: "Country is required" })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" })
    }

    // Check if user has already changed their country
    if (user.countryChangedAt) {
      return NextResponse.json({ success: false, error: "Country can only be changed once" })
    }

    await db
      .update(users)
      .set({
        country: country,
        countryChangedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user country:", error)
    return NextResponse.json({ success: false, error: "Failed to update country" })
  }
}
