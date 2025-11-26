"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader, AlertTriangle } from "lucide-react"
import { useSignIn, useAuth, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

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
      if (!signIn) {
        setError("Sign in is not available")
        setIsLoading(false)
        return
      }

      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        window.location.href = "/admin/dashboard"
      } else {
        setError("Sign in incomplete. Please try again.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.errors?.[0]?.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setError("")
    } catch (err: any) {
      console.error("Sign out error:", err)
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
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl overflow-hidden">
          {/* Blur overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-[#0B0C10]/60 z-10 flex items-center justify-center">
            <div className="text-center p-6">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">UNDER DEVELOPMENT</h2>
              <p className="text-[#888888] mb-4">This admin login page is currently under maintenance.</p>
              <p className="text-[#00FFFF] text-sm">
                Please use the{" "}
                <a href="/admin/access-key" className="underline hover:text-[#00CCCC]">
                  Admin Access Key
                </a>{" "}
                method instead.
              </p>
            </div>
          </div>

          {/* Original blurred content */}
          <div className="opacity-30 blur-sm pointer-events-none">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
                moBix Admin
              </h1>
              <p className="text-[#888888] text-sm">Sign in to your admin account</p>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-[#1A1B23]/60 rounded-lg" />
              <div className="h-12 bg-[#1A1B23]/60 rounded-lg" />
              <div className="h-12 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] rounded-lg" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
