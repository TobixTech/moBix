"use client"

import { trackContentView, trackContentLike, trackWatchTime } from "@/lib/server-actions"

let lastWatchTimeUpdate = 0
let accumulatedWatchTime = 0

export async function trackView(contentId: string, contentType: "movie" | "series") {
  try {
    await trackContentView(contentId, contentType)
  } catch (error) {
    console.error("Failed to track view:", error)
  }
}

export async function trackLike(contentId: string, contentType: "movie" | "series", isLiking: boolean) {
  try {
    await trackContentLike(contentId, contentType, isLiking)
  } catch (error) {
    console.error("Failed to track like:", error)
  }
}

export function trackWatchTimeProgress(contentId: string, contentType: "movie" | "series", currentTimeSeconds: number) {
  const now = Date.now()
  const timeSinceLastUpdate = (now - lastWatchTimeUpdate) / 1000 / 60 // in minutes

  // Only update every 5 minutes of watch time
  if (timeSinceLastUpdate >= 5 || accumulatedWatchTime === 0) {
    accumulatedWatchTime += timeSinceLastUpdate
    lastWatchTimeUpdate = now

    // Send to server
    trackWatchTime(contentId, contentType, timeSinceLastUpdate).catch(console.error)
  }
}

export function resetWatchTimeTracker() {
  lastWatchTimeUpdate = Date.now()
  accumulatedWatchTime = 0
}
