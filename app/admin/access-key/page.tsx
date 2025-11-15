"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Lock, Loader, Key } from 'lucide-react'
import { motion } from "framer-motion"
import { grantAdminAccessWithKey } from "@/lib/server-actions"

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

    console.log("[v0] Submitting access key...")

    try {
      const result = await grantAdminAccessWithKey(accessKey)

      if (result.success) {
        console.log("[v0] Access key validated successfully")
        setSuccess(true)
        setAccessKey("")
        
        setTimeout(() => {
          console.log("[v0] Redirecting to admin dashboard...")
          window.location.replace("/admin/dashboard")
        }, 3000)
      } else {
        console.log("[v0] Access key validation failed:", result.error)
        setError(result.error || "Invalid access key")
      }
    } catch (err: any) {
      console.error("[v0] Error validating access key:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                {success ? (
                  <Lock className="w-12 h-12 text-green-400" />
                ) : (
                  <Key className="w-12 h-12 text-[#00FFFF]" />
                )}
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
              Admin Access
            </h1>
            <p className="text-[#888888] text-sm">
              {success ? "Access granted! Redirecting..." : "Enter your secret access key"}
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Access granted! Redirecting to admin dashboard...
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter secret access key"
                disabled={loading || success}
                className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all disabled:opacity-50"
                required
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

          <div className="mt-6 p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg">
            <p className="text-[#888888] text-xs text-center mb-2">
              <strong className="text-cyan-400">Note:</strong> You must be signed in to use this feature
            </p>
            <p className="text-[#888888] text-xs text-center">
              Key is stored in <code className="bg-white/10 px-1 rounded text-cyan-400">ADMIN_SECRET_KEY</code> environment variable
              <br />
              Default: <code className="bg-white/10 px-1 rounded text-cyan-400">MOBIX_SECRET_2024</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
