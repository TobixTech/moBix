"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { useSignUp, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import EmailVerification from "@/components/email-verification"
import { verifyAdminInvitationCode, checkAdminCount, assignAdminRole } from "@/lib/server-actions"

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
  const { signOut } = useClerk()
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
      console.error("Signup error:", err)
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.")
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = async (code: string) => {
    try {
      setIsLoading(true)

      if (!signUp) {
        setError("Sign up is not available")
        setIsLoading(false)
        return
      }

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })

        const userId = completeSignUp.createdUserId

        if (userId) {
          const result = await assignAdminRole(userId)

          if (!result.success) {
            console.error("Failed to assign admin role:", result.error)
            setError(result.error || "Failed to assign admin role")
            setIsLoading(false)
            return
          }
        }

        window.location.href = "/admin/dashboard"
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err.errors?.[0]?.message || "Verification failed")
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
              <p className="text-[#888888] mb-4">This admin sign-up page is currently under maintenance.</p>
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
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] bg-clip-text text-transparent mb-2">
                moBix Admin
              </h1>
              <p className="text-[#888888] text-sm">Create your admin account</p>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-[#1A1B23]/60 rounded-lg" />
              <div className="h-12 bg-[#1A1B23]/60 rounded-lg" />
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
