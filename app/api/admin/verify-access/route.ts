import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json()

    if (!accessKey) {
      return NextResponse.json({ success: false, error: "Access key is required" }, { status: 400 })
    }

    // Check against environment variables
    const validKeys = [
      process.env.ADMIN_ACCESS_KEY,
      process.env.ADMIN_SECRET_KEY,
      process.env.ADMIN_INVITATION_CODE,
      process.env.ADMIN_PIN,
      process.env.SECRET_KEY,
    ].filter(Boolean)

    const isValid = validKeys.includes(accessKey)

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid access key" }, { status: 401 })
    }

    // Create response with success
    const response = NextResponse.json({ success: true })

    // Set cookie that expires in 6 hours
    const sixHoursInSeconds = 6 * 60 * 60
    const expiryTime = Date.now() + sixHoursInSeconds * 1000

    response.cookies.set("admin_access_verified", expiryTime.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sixHoursInSeconds,
    })

    return response
  } catch (error: any) {
    console.error("Admin verify access error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
