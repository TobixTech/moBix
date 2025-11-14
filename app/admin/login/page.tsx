"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react'
import { useSignIn, useAuth, useClerk } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { useEffect } from "react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, setActive } = useSignIn()
  const { isLoaded, userId, sessionClaims } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isLoaded && userId) {
      const userRole = sessionClaims?.metadata?.role
      if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [isLoaded, userId, sessionClaims, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Starting admin login process...")
      
      if (!signIn) {
        setError("Sign in is not available")
        setIsLoading(false)
        return
      }

      console.log("[v0] Attempting sign in...")
      const result = await signIn.create({
        identifier: email,
        password,
      })

      console.log("[v0] Sign in result:", result.status)

      if (result.status === "complete") {
        console.log("[v0] Setting active session...")
        await setActive({ session: result.createdSessionId })
        
        console.log("[v0] Redirecting to admin dashboard...")
        window.location.href = "/admin/dashboard"
      } else {
        setError("Sign in incomplete. Please try again.")
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setError(err.errors?.[0]?.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setError("")
      console.log("[v0] User signed out successfully")
    } catch (err: any) {
      console.error("[v0] Sign out error:", err)
      setError("Failed to sign out")
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#00FFFF]" />
      </div>
    )
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/20 via-transparent to-[#00FFFF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
                moBix Admin
              </h1>
              <p className="text-[#888888] text-sm">Sign in to your admin account</p>
            </motion.div>

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
              onSubmit={handleSignIn}
            >
              {/* Email Input */}
              <motion.div
                className="relative"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type="email"
                  placeholder="Admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
              </motion.div>

              {/* Password Input */}
              <motion.div
                className="relative"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#888888] hover:text-[#00FFFF] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all relative overflow-hidden group mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? "Signing in..." : "Sign In to Admin"}</span>
              </motion.button>
            </motion.form>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <p className="text-[#888888] text-sm">
                Don't have an admin account?{" "}
                <a href="/admin/signup" className="text-[#00FFFF] hover:text-[#00CCCC] transition">
                  Create one
                </a>
              </p>
            </motion.div>

            <motion.div
              className="mt-6 p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-[#00FFFF] text-xs mb-2">
                <strong>Admin Access:</strong> This is a private admin portal. Only authorized administrators can access this area.
              </p>
              <p className="text-[#888888] text-xs">
                <strong>Testing Multiple Accounts?</strong> If you're already logged in, please{" "}
                <button 
                  onClick={handleSignOut}
                  className="text-[#00FFFF] hover:underline"
                  type="button"
                >
                  sign out first
                </button>
                {" "}before logging in with a different account.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
