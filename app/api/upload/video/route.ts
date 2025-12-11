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

    // Check file size (max 500MB for direct upload due to timeout)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 500MB" }, { status: 400 })
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

    const VOE_API_KEY = process.env.VOE_API_KEY

    if (VOE_API_KEY) {
      console.log("[VideoUpload] Attempting direct VOE upload...")

      try {
        // Step 1: Get upload server from VOE
        const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)

        if (!serverResponse.ok) {
          throw new Error("Failed to get VOE upload server")
        }

        const serverData = await serverResponse.json()
        console.log("[VideoUpload] VOE server response:", serverData)

        if (serverData.status === 200 && serverData.result) {
          const uploadServerUrl = serverData.result
          console.log("[VideoUpload] Got upload server:", uploadServerUrl)

          // Step 2: Upload file directly to VOE server
          const voeFormData = new FormData()
          voeFormData.append("key", VOE_API_KEY)
          voeFormData.append("file", file)
          if (title) voeFormData.append("title", title)

          console.log("[VideoUpload] Uploading to VOE server...")
          const uploadResponse = await fetch(uploadServerUrl, {
            method: "POST",
            body: voeFormData,
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            console.log("[VideoUpload] VOE upload result:", uploadResult)

            if (uploadResult.status === 200 && uploadResult.result) {
              const fileCode = uploadResult.result.filecode || uploadResult.result.file_code

              if (fileCode) {
                const embedUrl = `https://voe.sx/e/${fileCode}`
                console.log("[VideoUpload] VOE success! Embed URL:", embedUrl)

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

          const errorText = await uploadResponse.text()
          console.error("[VideoUpload] VOE upload failed:", errorText)
        }
      } catch (voeError: any) {
        console.error("[VideoUpload] VOE direct upload error:", voeError.message)
      }
    }

    console.log("[VideoUpload] Falling back to Vercel Blob storage...")

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const blobPath = `creator-videos/${user.id}/${timestamp}-${safeFileName}`

      const blob = await put(blobPath, file, {
        access: "public",
        addRandomSuffix: true,
      })

      console.log("[VideoUpload] Blob upload successful:", blob.url)

      return NextResponse.json({
        success: true,
        embedUrl: blob.url,
        fileCode: `blob-${timestamp}`,
        fileSize: file.size,
        storageType: "blob",
        warning: VOE_API_KEY
          ? "VOE upload failed, video stored in backup storage"
          : "Configure VOE_API_KEY for optimized video streaming",
      })
    } catch (blobError: any) {
      console.error("[VideoUpload] Blob upload also failed:", blobError)
      return NextResponse.json({ success: false, error: "Failed to upload video. Please try again." }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[VideoUpload] Unexpected error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
