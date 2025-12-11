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
      return NextResponse.json(
        { success: false, error: "Failed to parse upload data. File may be too large." },
        { status: 400 },
      )
    }

    const file = formData.get("video") as File
    const title = formData.get("title") as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    console.log("[VideoUpload] File received:", file.name, "Size:", file.size, "Type:", file.type)

    const maxSize = 500 * 1024 * 1024 // 500MB - more realistic for 60s timeout
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 500MB for reliable uploads.`,
        },
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

    const VOE_API_KEY = process.env.VOE_API_KEY

    if (VOE_API_KEY) {
      console.log("[VideoUpload] Attempting VOE direct upload...")

      try {
        // First get the upload server
        const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)
        const serverText = await serverResponse.text()

        let serverData: any
        try {
          serverData = JSON.parse(serverText)
        } catch {
          console.log("[VideoUpload] VOE server response not JSON:", serverText)
          // Continue with blob URL
        }

        if (serverData?.result) {
          const uploadServer = serverData.result
          console.log("[VideoUpload] VOE upload server:", uploadServer)

          // Upload directly to VOE server
          const voeFormData = new FormData()
          voeFormData.append("api_key", VOE_API_KEY)
          voeFormData.append("file", file)

          const uploadResponse = await fetch(uploadServer, {
            method: "POST",
            body: voeFormData,
          })

          const uploadText = await uploadResponse.text()
          console.log("[VideoUpload] VOE upload response:", uploadText)

          let uploadData: any
          try {
            uploadData = JSON.parse(uploadText)
          } catch {
            console.log("[VideoUpload] VOE upload response not JSON, using blob")
          }

          if (uploadData?.files?.[0]?.url || uploadData?.result?.url) {
            const voeUrl = uploadData.files?.[0]?.url || uploadData.result?.url
            const fileCode = uploadData.files?.[0]?.filecode || uploadData.result?.filecode
            console.log("[VideoUpload] VOE upload successful:", voeUrl)

            return NextResponse.json({
              success: true,
              embedUrl: `https://voe.sx/e/${fileCode}`,
              fileCode: fileCode,
              fileSize: file.size,
              storageType: "voe",
              message: "Video uploaded to VOE successfully",
            })
          }
        }
      } catch (voeError: any) {
        console.error("[VideoUpload] VOE error:", voeError.message)
        // Fall through to return blob URL
      }
    }

    // Return Blob URL as fallback - this always works
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
