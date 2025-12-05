import { type NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get IP address from headers
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

    // Detect country from IP
    let country = "Unknown"
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country`, {
        next: { revalidate: 3600 },
      })
      const geoData = await geoResponse.json()
      if (geoData.status === "success") {
        country = geoData.country
      }
    } catch (e) {
      console.error("Failed to detect country:", e)
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    const email = user.emailAddresses[0]?.emailAddress || ""

    if (existingUser) {
      // Update user - only update country/IP if not already set
      await db
        .update(users)
        .set({
          email,
          firstName: user.firstName || existingUser.firstName,
          lastName: user.lastName || existingUser.lastName,
          username: user.username || existingUser.username,
          country: existingUser.country || country,
          ipAddress: existingUser.ipAddress || ipAddress,
        })
        .where(eq(users.clerkId, clerkId))

      return NextResponse.json({
        success: true,
        isNew: false,
        user: existingUser,
      })
    }

    // Create new user with detected country
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        country,
        ipAddress,
      })
      .returning()

    // Create welcome notification
    await db.insert(notifications).values({
      userId: newUser.id,
      title: "Welcome to moBix!",
      message: "Thanks for joining! Start exploring our collection of movies and enjoy your experience.",
      type: "welcome",
      isRead: false,
    })

    return NextResponse.json({
      success: true,
      isNew: true,
      user: newUser,
    })
  } catch (error) {
    console.error("Error syncing user:", error)
    return NextResponse.json({ success: false, error: "Failed to sync user" }, { status: 500 })
  }
}
