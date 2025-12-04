"use client"

import type React from "react"
import CountrySelect from "@/components/country-select"
import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, Key, CheckCircle } from "lucide-react"
import { useSignUp, useSignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: React.ReactNode
  defaultTab?: "login" | "signup" | "verification" | "forgot-password" | "reset-code" | "new-password" | "reset-success"
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LOADING_MESSAGES = {
  login: "Signing in...",
  signup: "Creating account...",
  verification: "Verifying...",
  "forgot-password": "Sending reset code...",
  "reset-code": "Verifying code...",
  "new-password": "Resetting password...",
}

export default function AuthModal({ isOpen, onClose, trigger, defaultTab = "login" }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultTab === "login")
  const [step, setStep] = useState<AuthModalProps["defaultTab"]>(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [country, setCountry] = useState("")
  const [detectedCountry, setDetectedCountry] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const { signUp, setActive: setActiveSignUp } = useSignUp()
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded } = useAuth()
  const router = useRouter()

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email), [email])
  const isPasswordValid = useMemo(() => password.length >= 8, [password])
  const doPasswordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword])

  useEffect(() => {
    const savedEmail = localStorage.getItem("mobix_remembered_email")
    const savedRememberMe = localStorage.getItem("mobix_remember_me") === "true"
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function detectCountry() {
      try {
        const response = await fetch("/api/get-ip", {
          signal: controller.signal,
          cache: "no-store",
        })
        const data = await response.json()
        if (data.country && data.country !== "Unknown") {
          setDetectedCountry(data.country)
          setCountry(data.country)
        }
      } catch {
        // Silently fail - country is optional
      }
    }
    detectCountry()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (step === "verification" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [step, countdown])

  const handleClose = useCallback(() => {
    onClose()
    // Reset state after modal closes
    setTimeout(() => {
      setIsLogin(defaultTab === "login")
      setStep(defaultTab)
      setShowPassword(false)
      setError("")
      setSuccessMessage("")
      setIsLoading(false)
      setLoadingMessage("")
      setOtp(["", "", "", "", "", ""])
    }, 200)
  }, [onClose, defaultTab])

  const startLoading = useCallback((message: string) => {
    setIsLoading(true)
    setLoadingMessage(message)
    setError("")
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingMessage("")
  }, [])

  if (!isOpen) return null

  if (!isLoaded) {
    return (
      <>
        {trigger}
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
          </div>
        </div>
      </>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }
    if (!password) {
      setError("Please enter your password")
      return
    }

    startLoading("Signing in...")

    try {
      if (!signIn) {
        setError("Sign in is not available")
        stopLoading()
        return
      }

      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        if (rememberMe) {
          localStorage.setItem("mobix_remembered_email", email)
          localStorage.setItem("mobix_remember_me", "true")
        } else {
          localStorage.removeItem("mobix_remembered_email")
          localStorage.removeItem("mobix_remember_me")
        }

        await setActiveSignIn({ session: result.createdSessionId })

        handleClose()
        router.push("/home")
      } else {
        setError("Sign in incomplete. Please try again.")
        stopLoading()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign in failed")
      stopLoading()
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim()) {
      setError("Please enter your first name")
      return
    }
    if (!lastName.trim()) {
      setError("Please enter your last name")
      return
    }
    if (!country) {
      setError("Please select your country")
      return
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters")
      return
    }
    if (!doPasswordsMatch) {
      setError("Passwords do not match")
      return
    }

    startLoading("Creating account...")

    try {
      if (!signUp) {
        setError("Sign up is not available")
        stopLoading()
        return
      }

      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim().toLowerCase(),
        password,
        unsafeMetadata: {
          country,
        },
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setOtp(["", "", "", "", "", ""])
      setCountdown(120)
      setCanResend(false)
      setStep("verification")
      stopLoading()
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed")
      stopLoading()
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    const fullCode = newOtp.join("")
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      handleVerifyOtp(pastedData)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return

    startLoading("Verifying...")

    try {
      if (!signUp) {
        setError("Sign up is not available")
        stopLoading()
        return
      }

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code,
      })

      if (completeSignUp.status === "complete") {
        await setActiveSignUp({ session: completeSignUp.createdSessionId })

        handleClose()
        router.push("/home")
      } else {
        setError("Verification incomplete. Please try again.")
        setOtp(["", "", "", "", "", ""])
        stopLoading()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed")
      setOtp(["", "", "", "", "", ""])
      stopLoading()
    }
  }

  const handleResendCode = async () => {
    if (!canResend || isLoading) return

    startLoading("Sending code...")

    try {
      if (!signUp) {
        setError("Sign up is not available")
        stopLoading()
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setCountdown(120)
      setCanResend(false)
      setSuccessMessage("New code sent!")
      setTimeout(() => setSuccessMessage(""), 3000)
      stopLoading()
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to resend code")
      stopLoading()
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }

    startLoading("Sending reset code...")

    try {
      if (!signIn) {
        setError("Password reset is not available")
        stopLoading()
        return
      }

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })

      setSuccessMessage("Reset code sent! Check your email.")
      setStep("reset-code")
      stopLoading()
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to send reset code")
      stopLoading()
    }
  }

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resetCode || resetCode.length < 6) {
      setError("Please enter the 6-digit code")
      return
    }

    startLoading("Verifying code...")

    try {
      if (!signIn) {
        setError("Password reset is not available")
        stopLoading()
        return
      }

      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
      })

      if (result.status === "needs_second_factor" || result.status === "needs_new_password") {
        setStep("new-password")
        stopLoading()
      } else {
        setError("Invalid code. Please try again.")
        stopLoading()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code")
      stopLoading()
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    startLoading("Resetting password...")

    try {
      if (!signIn) {
        setError("Password reset is not available")
        stopLoading()
        return
      }

      const result = await signIn.resetPassword({
        password: newPassword,
      })

      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId })
        setSuccessMessage("Password reset successful!")
        setStep("reset-success")
        stopLoading()
      } else {
        setError("Password reset incomplete")
        stopLoading()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to reset password")
      stopLoading()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      {trigger}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md bg-[#1A1B23] border border-[#2A2B33] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-[#1A1B23]/95 z-50 flex flex-col items-center justify-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-[#00FFFF] animate-spin" />
                      <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#00FFFF]/20 animate-ping" />
                    </div>
                    <p className="text-white font-medium text-lg">{loadingMessage}</p>
                    <p className="text-[#888888] text-sm">Please wait...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 text-[#888888] hover:text-white hover:bg-[#2A2B33] rounded-full transition z-10 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="pt-8 pb-4 px-8 text-center">
                <motion.h2
                  className="text-3xl font-bold text-[#00FFFF] mb-2"
                  key={step}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {step === "login" && "Welcome Back"}
                  {step === "signup" && "Create Account"}
                  {step === "verification" && "Verify Email"}
                  {step === "forgot-password" && "Reset Password"}
                  {step === "reset-code" && "Enter Code"}
                  {step === "new-password" && "New Password"}
                  {step === "reset-success" && "Success!"}
                </motion.h2>
                <motion.p
                  className="text-[#888888]"
                  key={`${step}-sub`}
                  initial={{ y: -5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                >
                  {step === "login" && "Sign in to continue watching"}
                  {step === "signup" && "Join moBix for free"}
                  {step === "verification" && `Code sent to ${email}`}
                  {step === "forgot-password" && "Enter your email to reset"}
                  {step === "reset-code" && "Check your email for the code"}
                  {step === "new-password" && "Choose a strong password"}
                  {step === "reset-success" && "Password reset complete"}
                </motion.p>
              </div>

              {/* Content */}
              <div className="p-8 pt-4">
                {error && (
                  <motion.div
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {successMessage}
                  </motion.div>
                )}

                {/* Login Form */}
                {step === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                      {email && !isEmailValid && (
                        <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[#888888] text-sm mb-2 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setError("")
                        setSuccessMessage("")
                        setStep("forgot-password")
                      }}
                      className="w-full py-3 text-[#00FFFF] hover:text-[#00CCCC] active:bg-[#00FFFF]/10 font-medium text-sm rounded-lg transition-all border border-transparent hover:border-[#00FFFF]/30"
                    >
                      Forgot your password? Click here to reset
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#2A2B33] bg-[#0B0C10] text-[#00FFFF] focus:ring-[#00FFFF]"
                      />
                      <label htmlFor="remember" className="text-[#888888] text-sm">
                        Remember me
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid || !password}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sign In
                    </button>

                    <p className="text-center text-[#888888] text-sm">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setStep("signup")
                          setError("")
                          setSuccessMessage("")
                        }}
                        className="text-[#00FFFF] hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  </form>
                )}

                {/* Signup Form */}
                {step === "signup" && (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#888888] text-sm mb-2">First Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                            placeholder="First"
                            required
                            autoComplete="given-name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[#888888] text-sm mb-2">Last Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                            placeholder="Last"
                            required
                            autoComplete="family-name"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-2">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <CountrySelect
                        value={country}
                        onChange={setCountry}
                        placeholder={detectedCountry ? `Detected: ${detectedCountry}` : "Select your country"}
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                      {email && !isEmailValid && (
                        <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full pl-11 pr-12 py-3 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            password && !isPasswordValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Create a password"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {password && !isPasswordValid && (
                        <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            confirmPassword && !doPasswordsMatch
                              ? "border-red-500"
                              : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Confirm your password"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      {confirmPassword && !doPasswordsMatch && (
                        <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !firstName ||
                        !lastName ||
                        !country ||
                        !isEmailValid ||
                        !isPasswordValid ||
                        !doPasswordsMatch
                      }
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Account
                    </button>

                    <p className="text-center text-[#888888] text-sm">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setStep("login")
                          setError("")
                          setSuccessMessage("")
                        }}
                        className="text-[#00FFFF] hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </p>

                    <p className="text-center text-[#666666] text-xs">
                      By signing up, you agree to our{" "}
                      <Link href="/terms" className="text-[#00FFFF] hover:underline" onClick={handleClose}>
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-[#00FFFF] hover:underline" onClick={handleClose}>
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                )}

                {step === "verification" && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-[#00FFFF]/20 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-[#00FFFF]" />
                      </div>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-14 text-center text-2xl font-bold bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {/* Resend Code */}
                    <div className="text-center space-y-2">
                      {!canResend ? (
                        <p className="text-[#666666] text-sm">
                          Resend code in <span className="text-[#00FFFF]">{formatTime(countdown)}</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isLoading}
                          className="text-[#00FFFF] hover:text-[#00CCCC] font-medium text-sm transition disabled:opacity-50"
                        >
                          Resend verification code
                        </button>
                      )}
                    </div>

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setStep("signup")
                        setError("")
                        setSuccessMessage("")
                      }}
                      disabled={isLoading}
                      className="w-full py-2 text-[#888888] hover:text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign Up
                    </button>
                  </div>
                )}

                {/* Forgot Password Form */}
                {step === "forgot-password" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Reset Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("login")
                        setError("")
                        setSuccessMessage("")
                      }}
                      className="w-full py-2 text-[#888888] hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </button>
                  </form>
                )}

                {/* Reset Code Form */}
                {step === "reset-code" && (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Verification Code</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white text-center text-xl tracking-widest placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          required
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || resetCode.length !== 6}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("forgot-password")
                        setError("")
                        setSuccessMessage("")
                      }}
                      className="w-full py-2 text-[#888888] hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </form>
                )}

                {/* New Password Form */}
                {step === "new-password" && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                          placeholder="Enter new password"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                          placeholder="Confirm new password"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Password
                    </button>
                  </form>
                )}

                {/* Success */}
                {step === "reset-success" && (
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    <p className="text-[#888888]">Your password has been reset successfully.</p>
                    <button
                      onClick={() => {
                        handleClose()
                        router.push("/home")
                      }}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                    >
                      Continue to Home
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
