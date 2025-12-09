import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ isCreator: false })
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return NextResponse.json({ isCreator: false })
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)

    return NextResponse.json({
      isCreator: !!profile && profile.status === "active",
      status: profile?.status || null,
    })
  } catch (error) {
    console.error("Error checking creator status:", error)
    return NextResponse.json({ isCreator: false })
  }
}
