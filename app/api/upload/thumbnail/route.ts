import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { put } from "@vercel/blob"

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

    const formData = await request.formData()
    const file = formData.get("thumbnail") as File
    const folder = (formData.get("folder") as string) || "creator-thumbnails"

    if (!file) {
      return NextResponse.json({ success: false, error: "No thumbnail file provided" }, { status: 400 })
    }

    console.log("[ThumbnailUpload] File received:", file.name, file.size, file.type)

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

    const PUBLITIO_API_KEY = process.env.PUBLITIO_API_KEY
    const PUBLITIO_API_SECRET = process.env.PUBLITIO_API_SECRET

    // If Publitio is not configured, use Blob storage
    if (!PUBLITIO_API_KEY || !PUBLITIO_API_SECRET) {
      console.log("[ThumbnailUpload] Publitio not configured, using Blob storage")

      try {
        const blob = await put(`${folder}/${userId}/${Date.now()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        console.log("[ThumbnailUpload] Uploaded to Blob:", blob.url)

        return NextResponse.json({
          success: true,
          thumbnailUrl: blob.url,
          downloadUrl: blob.url,
          publicId: "blob-" + Date.now(),
          fileSize: file.size,
          storageType: "blob",
        })
      } catch (blobError: any) {
        console.error("[ThumbnailUpload] Blob upload failed:", blobError)
        return NextResponse.json(
          { success: false, error: "Thumbnail upload failed. Please try again." },
          { status: 500 },
        )
      }
    }

    // Publitio is configured - proceed with Publitio upload
    console.log("[ThumbnailUpload] Using Publitio API")

    try {
      // Generate Publitio authentication signature
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = crypto.randomBytes(8).toString("hex")
      const signature = crypto
        .createHash("sha1")
        .update(timestamp + nonce + PUBLITIO_API_SECRET)
        .digest("hex")

      // Upload to Publitio
      const publitioFormData = new FormData()
      publitioFormData.append("file", file)
      publitioFormData.append("folder", folder)
      publitioFormData.append("public_id", `${userId}-${Date.now()}`)

      const publitioResponse = await fetch(
        `https://api.publit.io/v1/files/create?api_key=${PUBLITIO_API_KEY}&api_timestamp=${timestamp}&api_nonce=${nonce}&api_signature=${signature}`,
        {
          method: "POST",
          body: publitioFormData,
        },
      )

      if (!publitioResponse.ok) {
        const errorText = await publitioResponse.text()
        console.error("[Publitio Upload Error]", errorText)
        throw new Error("Failed to upload to Publitio")
      }

      const publitioResult = await publitioResponse.json()
      console.log("[Publitio] Response:", publitioResult)

      if (!publitioResult.success) {
        throw new Error("Publitio upload failed")
      }

      return NextResponse.json({
        success: true,
        thumbnailUrl: publitioResult.url_preview,
        downloadUrl: publitioResult.url_download,
        publicId: publitioResult.public_id,
        fileSize: file.size,
        storageType: "publitio",
      })
    } catch (publitioError: any) {
      console.error("[Publitio Error]", publitioError)

      // Fallback to Blob storage
      console.log("[ThumbnailUpload] Publitio failed, falling back to Blob storage")

      try {
        const blob = await put(`${folder}/${userId}/${Date.now()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        return NextResponse.json({
          success: true,
          thumbnailUrl: blob.url,
          downloadUrl: blob.url,
          publicId: "blob-" + Date.now(),
          fileSize: file.size,
          storageType: "blob",
          warning: "Uploaded to temporary storage.",
        })
      } catch (blobError) {
        return NextResponse.json(
          { success: false, error: publitioError.message || "Thumbnail upload failed" },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    console.error("[ThumbnailUpload] Error:", error)
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
