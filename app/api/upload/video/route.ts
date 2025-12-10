import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[VideoUpload] Starting upload request")

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

    if (creator.status !== "active") {
      return NextResponse.json({ success: false, error: "Your creator account is suspended" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const title = formData.get("title") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    console.log("[VideoUpload] File received:", file.name, file.size)

    // Check file size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024
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

    // If VOE is not configured, use Blob storage and return a placeholder URL
    if (!VOE_API_KEY) {
      console.log("[VideoUpload] VOE not configured, using Blob storage")

      try {
        // Upload to Vercel Blob
        const blob = await put(`creator-videos/${userId}/${Date.now()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        console.log("[VideoUpload] Uploaded to Blob:", blob.url)

        return NextResponse.json({
          success: true,
          embedUrl: blob.url,
          fileCode: "blob-" + Date.now(),
          fileSize: file.size,
          storageType: "blob",
        })
      } catch (blobError: any) {
        console.error("[VideoUpload] Blob upload failed:", blobError)
        return NextResponse.json(
          { success: false, error: "Video upload failed. Please try again or use URL mode." },
          { status: 500 },
        )
      }
    }

    // VOE API is configured - proceed with VOE upload
    console.log("[VideoUpload] Using VOE API")

    try {
      // First, get upload server URL from VOE
      const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)

      if (!serverResponse.ok) {
        console.error("[VOE] Failed to get upload server:", serverResponse.status)
        throw new Error("Failed to connect to VOE")
      }

      const serverData = await serverResponse.json()
      console.log("[VOE] Server response:", serverData)

      if (serverData.status !== 200 || !serverData.result) {
        throw new Error("VOE service unavailable")
      }

      const uploadUrl = serverData.result

      // Upload to VOE server
      const voeFormData = new FormData()
      voeFormData.append("api_key", VOE_API_KEY)
      voeFormData.append("file", file)
      if (title) {
        voeFormData.append("title", title)
      }

      console.log("[VideoUpload] Uploading to VOE:", uploadUrl)

      const voeResponse = await fetch(uploadUrl, {
        method: "POST",
        body: voeFormData,
      })

      if (!voeResponse.ok) {
        const errorText = await voeResponse.text()
        console.error("[VOE Upload Error]", errorText)
        throw new Error("Failed to upload to VOE")
      }

      const voeResult = await voeResponse.json()
      console.log("[VOE] Upload response:", voeResult)

      if (voeResult.status !== 200 || !voeResult.result?.filecode) {
        throw new Error(voeResult.msg || "VOE upload failed")
      }

      const fileCode = voeResult.result.filecode
      const embedUrl = `https://voe.sx/e/${fileCode}`

      return NextResponse.json({
        success: true,
        embedUrl,
        fileCode,
        fileSize: file.size,
        storageType: "voe",
      })
    } catch (voeError: any) {
      console.error("[VOE Error]", voeError)

      // Fallback to Blob storage
      console.log("[VideoUpload] VOE failed, falling back to Blob storage")

      try {
        const blob = await put(`creator-videos/${userId}/${Date.now()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        return NextResponse.json({
          success: true,
          embedUrl: blob.url,
          fileCode: "blob-" + Date.now(),
          fileSize: file.size,
          storageType: "blob",
          warning: "Video uploaded to temporary storage. VOE integration failed.",
        })
      } catch (blobError) {
        return NextResponse.json({ success: false, error: voeError.message || "Video upload failed" }, { status: 500 })
      }
    }
  } catch (error: any) {
    console.error("[VideoUpload] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
