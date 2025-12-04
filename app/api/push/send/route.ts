import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { getAllPushSubscriptions } from "@/lib/server-actions"

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:admin@mobix.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication (you should add proper auth check here)
    const { title, body, url } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
    }

    const { subscriptions } = await getAllPushSubscriptions()

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/home",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      ),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    })
  } catch (error: any) {
    console.error("Error sending push notifications:", error)
    return NextResponse.json({ error: error.message || "Failed to send notifications" }, { status: 500 })
  }
}
