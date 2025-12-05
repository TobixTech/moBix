"use client"

import { useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"

export function UserSync() {
  const { isSignedIn, isLoaded } = useUser()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasSynced.current) {
      hasSynced.current = true

      // Sync user to database with IP detection
      fetch("/api/user/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.isNew) {
            console.log("New user synced with country:", data.user?.country)
          }
        })
        .catch((err) => console.error("Failed to sync user:", err))
    }
  }, [isLoaded, isSignedIn])

  return null
}
