import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"

// Publitio API for thumbnail uploads
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
    const file = formData.get("thumbnail") as File
    const folder = (formData.get("folder") as string) || "creator-thumbnails"

    if (!file) {
      return NextResponse.json({ error: "No thumbnail file provided" }, { status: 400 })
    }

    // Check file size (max 15MB)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 15MB" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpg, png, webp" }, { status: 400 })
    }

    const PUBLITIO_API_KEY = process.env.PUBLITIO_API_KEY
    const PUBLITIO_API_SECRET = process.env.PUBLITIO_API_SECRET

    if (!PUBLITIO_API_KEY || !PUBLITIO_API_SECRET) {
      return NextResponse.json({ error: "Publitio API not configured" }, { status: 500 })
    }

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
      return NextResponse.json({ error: "Failed to upload to Publitio" }, { status: 500 })
    }

    const publitioResult = await publitioResponse.json()

    // Publitio returns the CDN URL
    // Typical response: { success: true, url_preview: "https://media.publit.io/...", url_download: "..." }
    if (!publitioResult.success) {
      return NextResponse.json({ error: "Publitio upload failed", details: publitioResult }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      thumbnailUrl: publitioResult.url_preview,
      downloadUrl: publitioResult.url_download,
      publicId: publitioResult.public_id,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("[Thumbnail Upload Error]", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
