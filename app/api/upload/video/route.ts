import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// VOE API for video uploads
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a creator
    const creator = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, userId),
    })

    if (!creator) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const title = formData.get("title") as string

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Check file size (VOE typically accepts up to 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024 // 10GB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10GB" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ["video/mp4", "video/webm", "video/mkv", "video/avi", "video/mov"]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mkv|avi|mov)$/i)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: mp4, webm, mkv, avi, mov" }, { status: 400 })
    }

    const VOE_API_KEY = process.env.VOE_API_KEY
    if (!VOE_API_KEY) {
      return NextResponse.json({ error: "VOE API not configured" }, { status: 500 })
    }

    // Upload to VOE using their API
    // VOE API endpoint for uploading
    const voeFormData = new FormData()
    voeFormData.append("file", file)
    voeFormData.append("api_key", VOE_API_KEY)
    if (title) {
      voeFormData.append("title", title)
    }

    const voeResponse = await fetch("https://voe.sx/api/upload/server", {
      method: "POST",
      body: voeFormData,
    })

    if (!voeResponse.ok) {
      const errorText = await voeResponse.text()
      console.error("[VOE Upload Error]", errorText)
      return NextResponse.json({ error: "Failed to upload to VOE" }, { status: 500 })
    }

    const voeResult = await voeResponse.json()

    // VOE returns the file code which can be used to create embed URL
    // Typical response: { status: 200, result: { filecode: "abc123" } }
    if (voeResult.status !== 200 || !voeResult.result?.filecode) {
      return NextResponse.json({ error: "VOE upload failed", details: voeResult }, { status: 500 })
    }

    const fileCode = voeResult.result.filecode
    const embedUrl = `https://voe.sx/e/${fileCode}`

    return NextResponse.json({
      success: true,
      embedUrl,
      fileCode,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("[Video Upload Error]", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
