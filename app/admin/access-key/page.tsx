"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader, Key, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function AdminAccessKeyPage() {
  const router = useRouter()
  const [accessKey, setAccessKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/admin/verify-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setAccessKey("")

        // Redirect to admin dashboard after brief success message
        setTimeout(() => {
          window.location.href = "/admin/point"
        }, 1000)
      } else {
        setError(result.error || "Invalid access key")
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.")
      } else {
        setError("Connection error. Please check your internet and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                {success ? <Lock className="w-12 h-12 text-green-400" /> : <Key className="w-12 h-12 text-[#00FFFF]" />}
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
              Admin Access
            </h1>
            <p className="text-[#888888] text-sm">
              {success ? "Access granted! Redirecting..." : "Enter your secret access key or PIN"}
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Access granted! Redirecting to admin panel...
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter access key or PIN"
                disabled={loading || success}
                className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all disabled:opacity-50"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || !accessKey.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : success ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Grant Admin Access</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[#555555] text-xs mt-6">Session expires after 6 hours of inactivity</p>
        </div>
      </motion.div>
    </div>
  )
}
