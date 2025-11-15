import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()
    
    // Get PIN from environment variable
    const correctPin = process.env.ADMIN_PIN || "1234"
    
    console.log("[v0] PIN verification attempt")
    
    if (pin === correctPin) {
      console.log("[v0] PIN verified successfully")
      return NextResponse.json({ success: true })
    }
    
    console.log("[v0] Invalid PIN")
    return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 })
  } catch (error) {
    console.error("[v0] PIN verification error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
