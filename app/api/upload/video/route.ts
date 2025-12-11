import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { put, del } from "@vercel/blob"

export const maxDuration = 60
export const dynamic = "force-dynamic"

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

    // Check file size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 10GB" }, { status: 400 })
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

    console.log("[VideoUpload] Step 1: Uploading to Vercel Blob as processor...")

    let blobUrl: string
    let blobPath: string

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      blobPath = `creator-videos/${userId}/${timestamp}-${safeFileName}`

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
      console.log("[VideoUpload] Step 2: Transferring to VOE from Blob URL...")

      try {
        // VOE supports remote URL upload - faster than direct file upload
        const voeParams = new URLSearchParams({
          key: VOE_API_KEY,
          url: blobUrl,
          title: title || file.name.replace(/\.[^/.]+$/, ""),
        })

        console.log("[VideoUpload] Calling VOE remote upload API...")
        const voeResponse = await fetch(`https://voe.sx/api/upload/url?${voeParams.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        })

        if (voeResponse.ok) {
          const voeResult = await voeResponse.json()
          console.log("[VideoUpload] VOE response:", voeResult)

          if (voeResult.status === 200 && voeResult.result) {
            const fileCode = voeResult.result.filecode || voeResult.result.file_code

            if (fileCode) {
              const embedUrl = `https://voe.sx/e/${fileCode}`
              console.log("[VideoUpload] VOE success! Embed URL:", embedUrl)

              try {
                await del(blobUrl)
                console.log("[VideoUpload] Cleaned up Blob file")
              } catch (delError) {
                console.log("[VideoUpload] Could not delete Blob file (non-critical):", delError)
              }

              return NextResponse.json({
                success: true,
                embedUrl: embedUrl,
                fileCode: fileCode,
                fileSize: file.size,
                storageType: "voe",
              })
            }
          }
        }

        // If VOE URL import fails, try direct file upload
        console.log("[VideoUpload] VOE URL import failed, trying direct upload...")

        // Get upload server
        const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)

        if (serverResponse.ok) {
          const serverData = await serverResponse.json()

          if (serverData.status === 200 && serverData.result) {
            const uploadServerUrl = serverData.result

            // Upload file directly
            const voeFormData = new FormData()
            voeFormData.append("key", VOE_API_KEY)
            voeFormData.append("file", file)
            if (title) voeFormData.append("title", title)

            const uploadResponse = await fetch(uploadServerUrl, {
              method: "POST",
              body: voeFormData,
            })

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()

              if (uploadResult.status === 200 && uploadResult.result) {
                const fileCode = uploadResult.result.filecode || uploadResult.result.file_code

                if (fileCode) {
                  const embedUrl = `https://voe.sx/e/${fileCode}`
                  console.log("[VideoUpload] VOE direct upload success! Embed URL:", embedUrl)

                  // Clean up Blob
                  try {
                    await del(blobUrl)
                  } catch (delError) {
                    console.log("[VideoUpload] Could not delete Blob file:", delError)
                  }

                  return NextResponse.json({
                    success: true,
                    embedUrl: embedUrl,
                    fileCode: fileCode,
                    fileSize: file.size,
                    storageType: "voe",
                  })
                }
              }
            }
          }
        }

        throw new Error("VOE upload failed")
      } catch (voeError: any) {
        console.error("[VideoUpload] VOE transfer error:", voeError.message)
        // Fall through to use Blob URL as final storage
      }
    }

    console.log("[VideoUpload] Using Blob URL as final storage")

    return NextResponse.json({
      success: true,
      embedUrl: blobUrl,
      fileCode: `blob-${Date.now()}`,
      fileSize: file.size,
      storageType: "blob",
      warning: VOE_API_KEY
        ? "VOE transfer failed, video stored in backup storage"
        : "Configure VOE_API_KEY for optimized video streaming",
    })
  } catch (error: any) {
    console.error("[VideoUpload] Unexpected error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
