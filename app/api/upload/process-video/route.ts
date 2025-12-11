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
    const { blobUrl, title, filename } = body

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
      console.log("[ProcessVideo] Downloading file from Blob...")
      const fileResponse = await fetch(blobUrl)

      if (!fileResponse.ok) {
        throw new Error("Failed to download from Blob")
      }

      const fileBlob = await fileResponse.blob()
      console.log("[ProcessVideo] Downloaded file, size:", fileBlob.size)

      // Step 1: Get VOE upload server
      const serverResponse = await fetch(`https://voe.sx/api/upload/server?key=${VOE_API_KEY}`)
      const serverData = await serverResponse.json()

      if (serverData.status !== 200 || !serverData.result) {
        throw new Error("Failed to get VOE upload server")
      }

      const uploadUrl = serverData.result
      console.log("[ProcessVideo] Got VOE upload server:", uploadUrl)

      // Step 2: Upload file directly to VOE
      const formData = new FormData()
      formData.append("key", VOE_API_KEY)
      formData.append("file", fileBlob, filename || "video.mp4")

      console.log("[ProcessVideo] Uploading to VOE...")
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      })

      const uploadText = await uploadResponse.text()
      console.log("[ProcessVideo] VOE upload response:", uploadText)

      let uploadResult
      try {
        uploadResult = JSON.parse(uploadText)
      } catch {
        // VOE sometimes returns HTML on error
        console.log("[ProcessVideo] VOE returned non-JSON, using Blob URL")
        return NextResponse.json({
          success: true,
          embedUrl: blobUrl,
          storageType: "blob",
          warning: "VOE upload failed, using backup storage",
        })
      }

      if (uploadResult.status === 200 && uploadResult.result) {
        const fileCode = uploadResult.result.filecode || uploadResult.result.file_code

        if (fileCode) {
          const embedUrl = `https://voe.sx/e/${fileCode}`
          console.log("[ProcessVideo] VOE success! Embed URL:", embedUrl)

          // Clean up Blob file in background
          del(blobUrl).catch(() => {})

          return NextResponse.json({
            success: true,
            embedUrl: embedUrl,
            fileCode: fileCode,
            storageType: "voe",
          })
        }
      }

      // VOE upload failed, use blob URL
      console.log("[ProcessVideo] VOE upload failed, using Blob URL")
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
