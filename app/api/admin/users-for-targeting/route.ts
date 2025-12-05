import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const adminVerifiedCookie = req.cookies.get("admin_access_verified")

    if (!adminVerifiedCookie?.value) {
      return NextResponse.json({ error: "Not authorized", users: [], success: false }, { status: 403 })
    }

    // Verify cookie hasn't expired
    const expiryTime = Number.parseInt(adminVerifiedCookie.value, 10)
    if (isNaN(expiryTime) || Date.now() > expiryTime) {
      return NextResponse.json({ error: "Session expired", users: [], success: false }, { status: 403 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Database not configured",
          users: [],
          success: false,
        },
        { status: 500 },
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    // Fetch all users
    const allUsers = await sql`
      SELECT 
        id, 
        email, 
        "firstName", 
        "lastName", 
        country,
        "ipAddress",
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
    return NextResponse.json(
      {
        error: "Failed to load users",
        users: [],
        success: false,
      },
      { status: 500 },
    )
  }
}
