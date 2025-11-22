"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, Loader, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useSignUp, useSignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import EmailVerification from "@/components/email-verification"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState<"form" | "verification">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signUp, setActive: setActiveSignUp } = useSignUp()
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded } = useAuth()
  const router = useRouter()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#00FFFF] animate-spin" />
      </div>
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      if (!signUp) {
        setError("Sign up is not available")
        setIsLoading(false)
        return
      }

      await signUp.create({
        emailAddress: email,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setStep("verification")
      setIsLoading(false)
    } catch (err: any) {
      console.error("[v0] Signup error:", err)
      setError(err.errors?.[0]?.message || "Sign up failed")
      setIsLoading(false)
    }
  }

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
        await setActiveSignIn({ session: result.createdSessionId })
        router.push("/home")
      } else {
        setError("Sign in incomplete. Please try again.")
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setError(err.errors?.[0]?.message || "Sign in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError("")
    setIsLoading(true)

    try {
      const authMethod = isLogin ? signIn : signUp

      if (!authMethod) {
        setError("Authentication is not available")
        setIsLoading(false)
        return
      }

      await authMethod.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/home",
      })
    } catch (err: any) {
      console.error("[v0] Google auth error:", err)
      setError(err.errors?.[0]?.message || "Google authentication failed")
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
        await setActiveSignUp({ session: completeSignUp.createdSessionId })
        router.push("/home")
      }
    } catch (err: any) {
      console.error("[v0] Verification error:", err)
      setError(err.errors?.[0]?.message || "Verification failed")
      setIsLoading(false)
    }
  }

  if (step === "verification" && !isLogin) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00FFFF]/10 via-transparent to-[#00FFFF]/5" />

        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Link
            href="/"
            className="absolute -top-16 left-0 flex items-center gap-2 text-[#888888] hover:text-[#00FFFF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
            <EmailVerification
              email={email}
              onVerified={handleVerificationComplete}
              onBack={() => {
                setStep("form")
                setError("")
              }}
              isLoading={isLoading}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-[#00FFFF]/10 via-transparent to-[#00FFFF]/5" />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Link
          href="/"
          className="absolute -top-16 left-0 flex items-center gap-2 text-[#888888] hover:text-[#00FFFF] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
              moBix
            </h1>
            <p className="text-[#888888] text-sm">Premium Streaming Experience</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-[#1A1B23]/50 p-1 rounded-lg border border-[#2A2B33]">
            {["Login", "Sign Up"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setIsLogin(tab === "Login")
                  setError("")
                  setStep("form")
                }}
                className={`flex-1 py-2.5 rounded-md font-semibold transition-all ${
                  (tab === "Login" && isLogin) || (tab === "Sign Up" && !isLogin)
                    ? "bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] shadow-lg shadow-[#00FFFF]/50"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 mb-6" onSubmit={isLogin ? handleSignIn : handleSignUp}>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
              />
            </div>

            <div className="relative">
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
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#00FFFF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1A1B23] border border-[#2A2B33] accent-[#00FFFF] cursor-pointer"
                />
                <span className="text-[#888888]">Remember me</span>
              </label>
              {isLogin && (
                <button type="button" className="text-[#00FFFF] hover:text-[#00CCCC] transition">
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading && <Loader className="w-4 h-4 animate-spin" />}
              <span>
                {isLoading ? "Processing..." : isLogin ? "Login to moBix" : "Proceed to Verification"}{" "}
                {!isLoading && "→"}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2A2B33] to-transparent" />
            <span className="text-[#888888] text-sm">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2A2B33] to-transparent" />
          </div>

          {/* Google Auth */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white hover:border-[#00FFFF] hover:bg-[#1A1B23] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <div className="relative w-5 h-5">
                  <Image src="https://www.google.com/favicon.ico" alt="Google" fill className="object-contain" />
                </div>
                <span className="text-sm font-medium">Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
