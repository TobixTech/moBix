import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { promotions, ipBlacklist, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const { userId } = await auth()
    const user = await currentUser()

    // Get IP address
    const ip =
      headersList.get("x-real-ip") ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("cf-connecting-ip") ||
      "unknown"

    const { phone, network, country } = await request.json()

    // Validation
    if (!phone || !network || !country) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if IP is blacklisted
    const blacklisted = await db.query.ipBlacklist.findFirst({
      where: eq(ipBlacklist.ipAddress, ip),
    })

    if (blacklisted) {
      return NextResponse.json({ error: "Failed. Try another device." }, { status: 403 })
    }

    // Check if IP already submitted
    const existingIp = await db.query.promotions.findFirst({
      where: eq(promotions.ipAddress, ip),
    })

    if (existingIp) {
      return NextResponse.json({ error: "You've already entered" }, { status: 400 })
    }

    // Check if email already submitted
    const email = user?.emailAddresses?.[0]?.emailAddress || ""
    if (email) {
      const existingEmail = await db.query.promotions.findFirst({
        where: eq(promotions.email, email),
      })

      if (existingEmail) {
        return NextResponse.json({ error: "This email already entered" }, { status: 400 })
      }
    }

    // Get internal user ID if logged in
    let internalUserId = null
    if (userId) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      })
      internalUserId = dbUser?.id || null
    }

    // Insert promotion entry
    await db.insert(promotions).values({
      userId: internalUserId,
      email: email || "anonymous",
      phone,
      network,
      ipAddress: ip,
      country,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Promotion submission error:", error)
    return NextResponse.json({ error: "Unable to submit. Please try again." }, { status: 500 })
  }
}
