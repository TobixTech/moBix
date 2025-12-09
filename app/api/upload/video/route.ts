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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a creator
    const creator = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, userId),
    })

    if (!creator) {
      return NextResponse.json({ success: false, error: "Not a creator" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const title = formData.get("title") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    // Check file size (VOE typically accepts up to 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024 // 10GB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 10GB" }, { status: 400 })
    }

    // Check file type
    const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
    if (!file.name.match(allowedExtensions)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: mp4, webm, mkv, avi, mov" },
        { status: 400 },
      )
    }

    const VOE_API_KEY = process.env.VOE_API_KEY
    if (!VOE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "VOE API not configured. Please contact admin." },
        { status: 500 },
      )
    }

    // First, get upload server URL from VOE
    const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)

    if (!serverResponse.ok) {
      console.error("[VOE] Failed to get upload server")
      return NextResponse.json({ success: false, error: "Failed to connect to VOE" }, { status: 500 })
    }

    const serverData = await serverResponse.json()

    if (serverData.status !== 200 || !serverData.result) {
      console.error("[VOE] Invalid server response:", serverData)
      return NextResponse.json({ success: false, error: "VOE service unavailable" }, { status: 500 })
    }

    const uploadUrl = serverData.result

    // Upload to VOE server
    const voeFormData = new FormData()
    voeFormData.append("api_key", VOE_API_KEY)
    voeFormData.append("file", file)
    if (title) {
      voeFormData.append("title", title)
    }

    console.log("[v0] Uploading to VOE:", uploadUrl)

    const voeResponse = await fetch(uploadUrl, {
      method: "POST",
      body: voeFormData,
    })

    if (!voeResponse.ok) {
      const errorText = await voeResponse.text()
      console.error("[VOE Upload Error]", errorText)
      return NextResponse.json({ success: false, error: "Failed to upload to VOE" }, { status: 500 })
    }

    const voeResult = await voeResponse.json()
    console.log("[v0] VOE response:", voeResult)

    // VOE returns the file code which can be used to create embed URL
    // Response format: { status: 200, result: { filecode: "abc123" } }
    if (voeResult.status !== 200 || !voeResult.result?.filecode) {
      console.error("[VOE] Upload failed:", voeResult)
      return NextResponse.json(
        { success: false, error: "VOE upload failed", details: voeResult.msg || "Unknown error" },
        { status: 500 },
      )
    }

    const fileCode = voeResult.result.filecode
    const embedUrl = `https://voe.sx/e/${fileCode}`

    return NextResponse.json({
      success: true,
      embedUrl,
      fileCode,
      fileSize: file.size,
    })
  } catch (error: any) {
    console.error("[Video Upload Error]", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
