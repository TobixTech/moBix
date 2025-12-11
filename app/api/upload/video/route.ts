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

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 100MB for direct upload" },
        { status: 400 },
      )
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

    console.log("[VideoUpload] Uploading to Vercel Blob first...")

    let blobUrl: string
    let blobPath: string

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      blobPath = `creator-videos/${user.id}/${timestamp}-${safeFileName}`

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

    const VOE_API_KEY = process.env.VOE_API_KEY

    if (VOE_API_KEY) {
      console.log("[VideoUpload] Attempting VOE URL upload with Blob URL...")

      try {
        // Use VOE's URL upload API which is more reliable for larger files
        const voeParams = new URLSearchParams({
          key: VOE_API_KEY,
          url: blobUrl,
          title: title || file.name.replace(/\.[^/.]+$/, ""),
        })

        const voeResponse = await fetch(`https://voe.sx/api/upload/url?${voeParams.toString()}`, {
          method: "GET",
        })

        const responseText = await voeResponse.text()
        console.log("[VideoUpload] VOE response:", responseText)

        let voeData: any
        try {
          voeData = JSON.parse(responseText)
        } catch {
          console.error("[VideoUpload] VOE returned non-JSON:", responseText)
          // Return Blob URL as fallback
          return NextResponse.json({
            success: true,
            embedUrl: blobUrl,
            fileCode: `blob-${Date.now()}`,
            fileSize: file.size,
            storageType: "blob",
            warning: "VOE upload failed, video stored in backup storage. VOE error: " + responseText.substring(0, 100),
          })
        }

        if (voeData.status === 200 && voeData.result) {
          const fileCode = voeData.result.filecode || voeData.result.file_code
          if (fileCode) {
            const embedUrl = `https://voe.sx/e/${fileCode}`
            console.log("[VideoUpload] VOE success! Embed URL:", embedUrl)

            return NextResponse.json({
              success: true,
              embedUrl: embedUrl,
              fileCode: fileCode,
              fileSize: file.size,
              storageType: "voe",
              blobBackup: blobUrl, // Keep blob URL as backup
            })
          }
        }

        console.log("[VideoUpload] VOE upload queued or failed, using Blob URL")
      } catch (voeError: any) {
        console.error("[VideoUpload] VOE error:", voeError.message)
      }
    }

    // Return Blob URL as the final fallback
    console.log("[VideoUpload] Using Blob URL as final result")
    return NextResponse.json({
      success: true,
      embedUrl: blobUrl,
      fileCode: `blob-${Date.now()}`,
      fileSize: file.size,
      storageType: "blob",
      warning: VOE_API_KEY
        ? "VOE processing may take a few minutes. Video is stored in backup storage."
        : "Configure VOE_API_KEY for optimized video streaming",
    })
  } catch (error: any) {
    console.error("[VideoUpload] Unexpected error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
