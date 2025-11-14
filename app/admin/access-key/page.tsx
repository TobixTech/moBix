"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Key, Lock, Loader, ArrowRight } from 'lucide-react'
import { grantAdminAccessWithKey } from "@/lib/server-actions"
import { useAuth } from "@clerk/nextjs"

export default function AdminAccessKeyPage() {
  const [accessKey, setAccessKey] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Attempting admin access with secret key...")
      
      if (!isSignedIn) {
        setError("Please sign in first before using the access key")
        setIsLoading(false)
        return
      }

      const result = await grantAdminAccessWithKey(accessKey)
      
      if (!result.success) {
        setError(result.error || "Invalid access key")
        setIsLoading(false)
        return
      }

      console.log("[v0] Admin access granted successfully!")
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log("[v0] Redirecting to admin dashboard...")
      
      window.location.href = "/admin/dashboard"
    } catch (err: any) {
      console.error("[v0] Access key error:", err)
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/20 via-transparent to-[#00FFFF]/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                  <Lock className="w-12 h-12 text-[#00FFFF]" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
                Admin Access
              </h1>
              <p className="text-[#888888] text-sm">Enter your secret key to gain admin access</p>
            </motion.div>

            {!isSignedIn && (
              <motion.div
                className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Please sign in to your account first, then return to this page to enter your access key.
              </motion.div>
            )}

            {error && (
              <motion.div
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.form
              className="space-y-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
            >
              <motion.div
                className="relative"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Key className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type="password"
                  placeholder="Enter Admin Secret Key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading || !isSignedIn}
                className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all relative overflow-hidden group mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Verifying and syncing session...</span>
                  </>
                ) : (
                  <>
                    <span>Grant Admin Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.div
              className="p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-[#00FFFF] text-xs mb-2">
                <strong>Secure Access:</strong> This is a temporary bypass mechanism for admin access.
              </p>
              <p className="text-[#888888] text-xs">
                If you don't have the secret key, please contact the system administrator.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
