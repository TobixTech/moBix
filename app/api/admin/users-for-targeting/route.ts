import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated", users: [] }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Check if user is admin
    const adminResult = await sql`
      SELECT role FROM "User" WHERE "clerkId" = ${userId}
    `

    if (!adminResult.length || adminResult[0].role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized", users: [] }, { status: 403 })
    }

    // Fetch all users
    const allUsers = await sql`
      SELECT 
        id, 
        email, 
        "firstName", 
        "lastName", 
        country,
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
      LIMIT 500
    `

    return NextResponse.json({
      success: true,
      users: allUsers || [],
      count: allUsers?.length || 0,
    })
  } catch (error) {
    console.error("Error getting users for targeting:", error)
    return NextResponse.json({ error: "Failed to load users", users: [] }, { status: 500 })
  }
}
