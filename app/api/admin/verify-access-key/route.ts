import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json()

    if (!accessKey) {
      return NextResponse.json({ success: false, error: "Access key is required" }, { status: 400 })
    }

    // Check against access key and invitation code environment variables ONLY (not PIN)
    const adminAccessKey = process.env.ADMIN_ACCESS_KEY
    const adminSecretKey = process.env.ADMIN_SECRET_KEY
    const adminInvitationCode = process.env.ADMIN_INVITATION_CODE

    const trimmedKey = accessKey.trim()

    let isValid = false

    // Only check access keys, NOT the PIN
    if (adminAccessKey && trimmedKey === adminAccessKey) {
      isValid = true
    } else if (adminSecretKey && trimmedKey === adminSecretKey) {
      isValid = true
    } else if (adminInvitationCode && trimmedKey === adminInvitationCode) {
      isValid = true
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid access key. Please check your credentials.",
        },
        { status: 401 },
      )
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
    console.error("Admin verify access key error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error occurred. Please try again.",
      },
      { status: 500 },
    )
  }
}
