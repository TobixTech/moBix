import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { checkUserPremiumStatus } from "@/lib/server-actions"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ isPremium: false })
    }

    const result = await checkUserPremiumStatus(userId)
    return NextResponse.json({ isPremium: result.isPremium })
  } catch (error) {
    console.error("Error checking premium status:", error)
    return NextResponse.json({ isPremium: false })
  }
}
