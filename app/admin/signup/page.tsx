"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, Loader, Key, ArrowLeft } from 'lucide-react'
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import EmailVerification from "@/components/email-verification"
import { verifyAdminInvitationCode, checkAdminCount } from "@/lib/server-actions"

export default function AdminSignupPage() {
  const [step, setStep] = useState<"form" | "verification">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [invitationCode, setInvitationCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signUp, setActive } = useSignUp()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      // Validate invitation code
      if (!invitationCode.trim()) {
        setError("Invitation code is required")
        setIsLoading(false)
        return
      }

      const isValidCode = await verifyAdminInvitationCode(invitationCode)
      if (!isValidCode) {
        setError("Invalid invitation code")
        setIsLoading(false)
        return
      }

      // Check admin count
      const canRegister = await checkAdminCount()
      if (!canRegister) {
        setError("Maximum number of admins (2) has been reached")
        setIsLoading(false)
        return
      }

      if (!signUp) {
        setError("Sign up is not available")
        setIsLoading(false)
        return
      }

      // Create the user
      const result = await signUp.create({
        emailAddress: email,
        password,
      })

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      // Move to verification step
      setStep("verification")
      setIsLoading(false)
    } catch (err: any) {
      console.log("[v0] Signup error:", err)
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.")
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = async () => {
    try {
      setIsLoading(true)

      if (!signUp) {
        setError("Sign up is not available")
        setIsLoading(false)
        return
      }

      // Complete the sign up
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: "", // This will be handled by the verification component
      })

      if (completeSignUp.status === "complete") {
        // Set the session
        await setActive({ session: completeSignUp.createdSessionId })

        // Redirect to admin dashboard
        router.push("/admin/dashboard")
      }
    } catch (err: any) {
      console.log("[v0] Verification error:", err)
      setError(err.errors?.[0]?.message || "Verification failed")
      setIsLoading(false)
    }
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
            <EmailVerification
              email={email}
              onVerified={handleVerificationComplete}
              onBack={() => setStep("form")}
              isLoading={isLoading}
            />
          </div>
        </div>
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
              <p className="text-[#888888] text-sm">Create your admin account</p>
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
              onSubmit={handleSignUp}
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

              {/* Confirm Password Input */}
              <motion.div
                className="relative"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
              </motion.div>

              {/* Invitation Code Input - REQUIRED */}
              <motion.div
                className="relative"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Key className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type="text"
                  placeholder="Invitation Code (required)"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all relative overflow-hidden group mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? "Creating Account..." : "Create Admin Account"}</span>
              </motion.button>
            </motion.form>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <p className="text-[#888888] text-sm">
                Already have an account?{" "}
                <a href="/admin/login" className="text-[#00FFFF] hover:text-[#00CCCC] transition">
                  Sign in
                </a>
              </p>
            </motion.div>

            <motion.div
              className="mt-6 p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-[#00FFFF] text-xs">
                <strong>Note:</strong> Only 2 admin accounts can be created. An invitation code is required to register.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
