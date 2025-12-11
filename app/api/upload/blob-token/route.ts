import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate user
        const { userId: clerkId } = await auth()
        if (!clerkId) {
          throw new Error("Unauthorized")
        }

        // Get internal user
        const user = await db.query.users.findFirst({
          where: eq(users.clerkId, clerkId),
        })

        if (!user) {
          throw new Error("User not found")
        }

        // Check creator status
        const creator = await db.query.creatorProfiles.findFirst({
          where: eq(creatorProfiles.userId, user.id),
        })

        if (!creator || creator.status !== "active") {
          throw new Error("Not an active creator")
        }

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/x-matroska",
            "video/avi",
            "video/quicktime",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          tokenPayload: JSON.stringify({
            userId: user.id,
            creatorId: creator.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[BlobToken] Upload completed:", blob.url)
        // You can track uploads here if needed
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error("[BlobToken] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
