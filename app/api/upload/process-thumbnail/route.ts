import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { del } from "@vercel/blob"
import crypto from "crypto"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Verify creator status
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const creator = await db.query.creatorProfiles.findFirst({
      where: eq(creatorProfiles.userId, user.id),
    })

    if (!creator || creator.status !== "active") {
      return NextResponse.json({ success: false, error: "Not an active creator" }, { status: 403 })
    }

    const body = await request.json()
    const { blobUrl } = body

    if (!blobUrl) {
      return NextResponse.json({ success: false, error: "No blob URL provided" }, { status: 400 })
    }

    console.log("[ProcessThumbnail] Processing blob URL:", blobUrl)

    const PUBLITIO_API_KEY = process.env.PUBLITIO_API_KEY
    const PUBLITIO_API_SECRET = process.env.PUBLITIO_API_SECRET

    if (!PUBLITIO_API_KEY || !PUBLITIO_API_SECRET) {
      console.log("[ProcessThumbnail] No Publitio keys, using Blob URL directly")
      return NextResponse.json({
        success: true,
        cdnUrl: blobUrl,
        storageType: "blob",
      })
    }

    try {
      // Generate Publitio signature
      const timestamp = Math.floor(Date.now() / 1000)
      const nonce = crypto.randomBytes(8).toString("hex")
      const signature = crypto
        .createHash("sha1")
        .update(timestamp + nonce + PUBLITIO_API_SECRET)
        .digest("hex")

      // Use Publitio remote fetch
      const publitioUrl = new URL("https://api.publit.io/v1/files/create")
      publitioUrl.searchParams.set("api_key", PUBLITIO_API_KEY)
      publitioUrl.searchParams.set("api_timestamp", timestamp.toString())
      publitioUrl.searchParams.set("api_nonce", nonce)
      publitioUrl.searchParams.set("api_signature", signature)
      publitioUrl.searchParams.set("file_url", blobUrl)
      publitioUrl.searchParams.set("public_id", `thumb_${Date.now()}`)

      console.log("[ProcessThumbnail] Calling Publitio API...")
      const publitioResponse = await fetch(publitioUrl.toString(), {
        method: "POST",
      })

      if (publitioResponse.ok) {
        const publitioResult = await publitioResponse.json()
        console.log("[ProcessThumbnail] Publitio response:", JSON.stringify(publitioResult))

        if (publitioResult.success && publitioResult.url_preview) {
          const cdnUrl = publitioResult.url_preview

          // Clean up Blob file
          try {
            await del(blobUrl)
            console.log("[ProcessThumbnail] Cleaned up Blob file")
          } catch (delError) {
            console.log("[ProcessThumbnail] Could not delete Blob (non-critical)")
          }

          return NextResponse.json({
            success: true,
            cdnUrl: cdnUrl,
            storageType: "publitio",
          })
        }
      }

      // Publitio failed, use blob URL
      console.log("[ProcessThumbnail] Publitio failed, using Blob URL")
      return NextResponse.json({
        success: true,
        cdnUrl: blobUrl,
        storageType: "blob",
      })
    } catch (publitioError: any) {
      console.error("[ProcessThumbnail] Publitio error:", publitioError.message)
      return NextResponse.json({
        success: true,
        cdnUrl: blobUrl,
        storageType: "blob",
      })
    }
  } catch (error: any) {
    console.error("[ProcessThumbnail] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
