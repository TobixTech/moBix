import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", users: [] }, { status: 401 })
    }

    // Verify admin
    const admin = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized", users: [] }, { status: 403 })
    }

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    })

    const usersForTargeting = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      country: u.country,
    }))

    return NextResponse.json({ users: usersForTargeting })
  } catch (error) {
    console.error("[v0] Error getting users for targeting:", error)
    return NextResponse.json({ error: "Failed to load users", users: [] }, { status: 500 })
  }
}
