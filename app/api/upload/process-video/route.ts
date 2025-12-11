import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { del } from "@vercel/blob"

export const maxDuration = 60

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
    const { blobUrl, title } = body

    if (!blobUrl) {
      return NextResponse.json({ success: false, error: "No blob URL provided" }, { status: 400 })
    }

    console.log("[ProcessVideo] Processing blob URL:", blobUrl)

    const VOE_API_KEY = process.env.VOE_API_KEY

    if (!VOE_API_KEY) {
      console.log("[ProcessVideo] No VOE_API_KEY, using Blob URL directly")
      return NextResponse.json({
        success: true,
        embedUrl: blobUrl,
        storageType: "blob",
      })
    }

    try {
      // Try VOE remote URL upload
      const voeParams = new URLSearchParams({
        key: VOE_API_KEY,
        url: blobUrl,
        title: title || "Uploaded Video",
      })

      console.log("[ProcessVideo] Calling VOE API...")
      const voeResponse = await fetch(`https://voe.sx/api/upload/url?${voeParams.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })

      if (voeResponse.ok) {
        const voeResult = await voeResponse.json()
        console.log("[ProcessVideo] VOE response:", JSON.stringify(voeResult))

        if (voeResult.status === 200 && voeResult.result) {
          const fileCode = voeResult.result.filecode || voeResult.result.file_code

          if (fileCode) {
            const embedUrl = `https://voe.sx/e/${fileCode}`
            console.log("[ProcessVideo] VOE success! Embed URL:", embedUrl)

            // Clean up Blob file
            try {
              await del(blobUrl)
              console.log("[ProcessVideo] Cleaned up Blob file")
            } catch (delError) {
              console.log("[ProcessVideo] Could not delete Blob (non-critical)")
            }

            return NextResponse.json({
              success: true,
              embedUrl: embedUrl,
              fileCode: fileCode,
              storageType: "voe",
            })
          }
        }
      }

      // VOE failed, use blob URL
      console.log("[ProcessVideo] VOE failed, using Blob URL")
      return NextResponse.json({
        success: true,
        embedUrl: blobUrl,
        storageType: "blob",
        warning: "VOE transfer failed, using backup storage",
      })
    } catch (voeError: any) {
      console.error("[ProcessVideo] VOE error:", voeError.message)
      return NextResponse.json({
        success: true,
        embedUrl: blobUrl,
        storageType: "blob",
        warning: "VOE transfer failed, using backup storage",
      })
    }
  } catch (error: any) {
    console.error("[ProcessVideo] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
