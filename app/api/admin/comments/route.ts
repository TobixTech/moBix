import { NextResponse } from "next/server"
import { getAllComments } from "@/lib/server-actions"

export async function GET() {
  try {
    const comments = await getAllComments()
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
