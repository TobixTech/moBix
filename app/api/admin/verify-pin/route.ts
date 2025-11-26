import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()

    // Get PIN from environment variable
    const correctPin = process.env.ADMIN_PIN || "1234"

    if (pin === correctPin) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 })
  } catch (error) {
    console.error("PIN verification error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
