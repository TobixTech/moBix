import { NextResponse } from "next/server"
import { getAdSettings } from "@/lib/server-actions"

export async function GET() {
  try {
    const settings = await getAdSettings()
    return NextResponse.json(settings || {})
  } catch (error) {
    console.error("[v0] Error fetching ad settings API:", error)
    return NextResponse.json({ error: "Failed to fetch ad settings" }, { status: 500 })
  }
}
