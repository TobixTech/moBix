import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { put, del } from "@vercel/blob"

export const maxDuration = 60 // 1 minute timeout for thumbnails
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("[ThumbnailUpload] Starting upload request")

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

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (e) {
      console.error("[ThumbnailUpload] Failed to parse form data:", e)
      return NextResponse.json({ success: false, error: "Failed to parse upload data" }, { status: 400 })
    }

    const file = formData.get("thumbnail") as File
    const folder = (formData.get("folder") as string) || "creator-thumbnails"

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No thumbnail file provided" }, { status: 400 })
    }

    console.log("[ThumbnailUpload] File received:", file.name, "Size:", file.size, "Type:", file.type)

    // Check file size (max 15MB)
    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 15MB" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Allowed: jpg, png, webp" }, { status: 400 })
    }

    console.log("[ThumbnailUpload] Step 1: Uploading to Vercel Blob as processor...")

    let blobUrl: string

    try {
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")

      const blob = await put(`${folder}/${userId}/${timestamp}-${safeFileName}`, file, {
        access: "public",
        addRandomSuffix: true,
      })

      blobUrl = blob.url
      console.log("[ThumbnailUpload] Blob upload successful:", blobUrl)
    } catch (blobError: any) {
      console.error("[ThumbnailUpload] Blob upload failed:", blobError)
      return NextResponse.json(
        { success: false, error: "Failed to upload thumbnail. Please try again." },
        { status: 500 },
      )
    }

    const PUBLITIO_API_KEY = process.env.PUBLITIO_API_KEY
    const PUBLITIO_API_SECRET = process.env.PUBLITIO_API_SECRET

    if (PUBLITIO_API_KEY && PUBLITIO_API_SECRET) {
      console.log("[ThumbnailUpload] Step 2: Transferring to Publitio from Blob URL...")

      try {
        // Generate Publitio authentication
        const timestamp = Math.floor(Date.now() / 1000)
        const nonce = Math.random().toString(36).substring(2, 10)
        const signature = crypto
          .createHash("sha1")
          .update(timestamp + nonce + PUBLITIO_API_SECRET)
          .digest("hex")

        // Publitio supports remote URL fetch
        const publitioParams = new URLSearchParams({
          api_key: PUBLITIO_API_KEY,
          api_timestamp: timestamp.toString(),
          api_nonce: nonce,
          api_signature: signature,
          file_url: blobUrl,
          folder: folder,
          public_id: `${userId}-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
        })

        console.log("[ThumbnailUpload] Calling Publitio remote fetch API...")
        const publitioResponse = await fetch(`https://api.publit.io/v1/files/create?${publitioParams.toString()}`, {
          method: "POST",
        })

        if (publitioResponse.ok) {
          const publitioResult = await publitioResponse.json()
          console.log("[ThumbnailUpload] Publitio response:", publitioResult)

          if (publitioResult.success && publitioResult.url_preview) {
            console.log("[ThumbnailUpload] Publitio success! URL:", publitioResult.url_preview)

            try {
              await del(blobUrl)
              console.log("[ThumbnailUpload] Cleaned up Blob file")
            } catch (delError) {
              console.log("[ThumbnailUpload] Could not delete Blob file (non-critical):", delError)
            }

            return NextResponse.json({
              success: true,
              thumbnailUrl: publitioResult.url_preview,
              downloadUrl: publitioResult.url_download || publitioResult.url_preview,
              publicId: publitioResult.public_id || publitioResult.id,
              fileSize: file.size,
              storageType: "publitio",
            })
          }
        }

        // If URL fetch fails, try direct upload
        console.log("[ThumbnailUpload] Publitio URL fetch failed, trying direct upload...")

        const directFormData = new FormData()
        directFormData.append("file", file)
        directFormData.append("folder", folder)
        directFormData.append("public_id", `${userId}-${Date.now()}`)

        const directParams = new URLSearchParams({
          api_key: PUBLITIO_API_KEY,
          api_timestamp: timestamp.toString(),
          api_nonce: nonce,
          api_signature: signature,
        })

        const directResponse = await fetch(`https://api.publit.io/v1/files/create?${directParams.toString()}`, {
          method: "POST",
          body: directFormData,
        })

        if (directResponse.ok) {
          const directResult = await directResponse.json()

          if (directResult.success && directResult.url_preview) {
            // Clean up Blob
            try {
              await del(blobUrl)
            } catch (delError) {
              console.log("[ThumbnailUpload] Could not delete Blob file:", delError)
            }

            return NextResponse.json({
              success: true,
              thumbnailUrl: directResult.url_preview,
              downloadUrl: directResult.url_download || directResult.url_preview,
              publicId: directResult.public_id || directResult.id,
              fileSize: file.size,
              storageType: "publitio",
            })
          }
        }

        throw new Error("Publitio upload failed")
      } catch (publitioError: any) {
        console.error("[ThumbnailUpload] Publitio transfer error:", publitioError.message)
        // Fall through to use Blob URL
      }
    }

    console.log("[ThumbnailUpload] Using Blob URL as final storage")

    return NextResponse.json({
      success: true,
      thumbnailUrl: blobUrl,
      downloadUrl: blobUrl,
      publicId: `blob-${Date.now()}`,
      fileSize: file.size,
      storageType: "blob",
      warning:
        PUBLITIO_API_KEY && PUBLITIO_API_SECRET
          ? "Publitio transfer failed, using backup storage"
          : "Configure PUBLITIO_API_KEY for CDN delivery",
    })
  } catch (error: any) {
    console.error("[ThumbnailUpload] Unexpected error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
