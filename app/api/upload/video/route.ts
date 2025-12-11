import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { put } from "@vercel/blob"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("[VideoUpload] Starting upload request")

    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const creator = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, user.id),
    })

    if (!creator) {
      return NextResponse.json({ success: false, error: "Not a creator" }, { status: 403 })
    }

    if (creator.status !== "active") {
      return NextResponse.json({ success: false, error: "Your creator account is suspended" }, { status: 403 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (e) {
      console.error("[VideoUpload] Failed to parse form data:", e)
      return NextResponse.json({ success: false, error: "Failed to parse upload data" }, { status: 400 })
    }

    const file = formData.get("video") as File
    const title = formData.get("title") as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    console.log("[VideoUpload] File received:", file.name, "Size:", file.size, "Type:", file.type)

    const maxSize = 1 * 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 1GB" }, { status: 400 })
    }

    // Check file type
    const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/x-matroska", "video/avi", "video/quicktime"]

    if (!file.name.match(allowedExtensions) && !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: mp4, webm, mkv, avi, mov" },
        { status: 400 },
      )
    }

    console.log("[VideoUpload] Uploading to Vercel Blob...")

    let blobUrl: string

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const blobPath = `creator-videos/${user.id}/${timestamp}-${safeFileName}`

      const blob = await put(blobPath, file, {
        access: "public",
        addRandomSuffix: true,
      })

      blobUrl = blob.url
      console.log("[VideoUpload] Blob upload successful:", blobUrl)
    } catch (blobError: any) {
      console.error("[VideoUpload] Blob upload failed:", blobError)
      return NextResponse.json({ success: false, error: "Failed to upload video. Please try again." }, { status: 500 })
    }

    // This allows large files to upload without timeout
    const VOE_API_KEY = process.env.VOE_API_KEY

    if (VOE_API_KEY) {
      console.log("[VideoUpload] Queuing VOE URL upload with Blob URL...")

      try {
        // Use VOE's URL upload API - non-blocking
        const voeParams = new URLSearchParams({
          key: VOE_API_KEY,
          url: blobUrl,
          title: title || file.name.replace(/\.[^/.]+$/, ""),
        })

        // Fire and forget - don't wait for VOE
        fetch(`https://voe.sx/api/upload/url?${voeParams.toString()}`, {
          method: "GET",
        })
          .then(async (voeResponse) => {
            try {
              const responseText = await voeResponse.text()
              console.log("[VideoUpload] VOE async response:", responseText)
            } catch (e) {
              console.error("[VideoUpload] VOE async error:", e)
            }
          })
          .catch((e) => {
            console.error("[VideoUpload] VOE fire-and-forget error:", e)
          })

        console.log("[VideoUpload] VOE upload queued, returning Blob URL immediately")
      } catch (voeError: any) {
        console.error("[VideoUpload] VOE queue error:", voeError.message)
      }
    }

    // Return Blob URL immediately - this is the reliable storage
    return NextResponse.json({
      success: true,
      embedUrl: blobUrl,
      fileCode: `blob-${Date.now()}`,
      fileSize: file.size,
      storageType: "blob",
      message: "Video uploaded successfully",
    })
  } catch (error: any) {
    console.error("[VideoUpload] Unexpected error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
