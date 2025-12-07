import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { contentReports, seriesReports, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const { contentId, contentType, reason, description, email } = await req.json()

    if (!contentId || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { userId: clerkId } = await auth()

    let dbUserId: string | null = null
    let userEmail = email || null

    if (clerkId) {
      const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
      dbUserId = dbUser?.id || null
      if (!userEmail && dbUser?.email) {
        userEmail = dbUser.email
      }
    }

    // Insert into appropriate table based on content type
    if (contentType === "series") {
      await db.insert(seriesReports).values({
        userId: dbUserId,
        seriesId: contentId,
        reason,
        description: description || null,
        status: "PENDING",
        email: userEmail || undefined,
      })
    } else {
      await db.insert(contentReports).values({
        userId: dbUserId,
        movieId: contentId,
        reason,
        description: description || null,
        status: "PENDING",
        email: userEmail || undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting report:", error)
    return NextResponse.json({ success: false, error: "Failed to submit report" }, { status: 500 })
  }
}
