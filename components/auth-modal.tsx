"use client"

import type React from "react"
import CountrySelect from "@/components/country-select"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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

  const isVerifying = useRef(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

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
          cache: "force-cache", // Cache the result
        })
        const data = await response.json()
        if (data.country && data.country !== "Unknown") {
          setDetectedCountry(data.country)
          if (!country) setCountry(data.country)
        }
      } catch {
        // Silently fail
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
    setTimeout(() => {
      setIsLogin(defaultTab === "login")
      setStep(defaultTab)
      setShowPassword(false)
      setError("")
      setSuccessMessage("")
      setIsLoading(false)
      setLoadingMessage("")
      setOtp(["", "", "", "", "", ""])
      isVerifying.current = false
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
      setError("Please enter a valid email")
      return
    }
    if (!password) {
      setError("Please enter your password")
      return
    }

    startLoading("Signing in...")

    try {
      if (!signIn) {
        setError("Sign in not available")
        stopLoading()
        return
      }

      const result = await signIn.create({ identifier: email, password })

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
        setError("Sign in incomplete")
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
      setError("Enter your first name")
      return
    }
    if (!lastName.trim()) {
      setError("Enter your last name")
      return
    }
    if (!country) {
      setError("Select your country")
      return
    }
    if (!isEmailValid) {
      setError("Enter a valid email")
      return
    }
    if (!isPasswordValid) {
      setError("Password must be 8+ characters")
      return
    }
    if (!doPasswordsMatch) {
      setError("Passwords don't match")
      return
    }

    startLoading("Creating account...")

    try {
      if (!signUp) {
        setError("Sign up not available")
        stopLoading()
        return
      }

      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim().toLowerCase(),
        password,
        unsafeMetadata: { country },
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setOtp(["", "", "", "", "", ""])
      setCountdown(120)
      setCanResend(false)
      setStep("verification")
      stopLoading()

      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed")
      stopLoading()
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    const fullCode = newOtp.join("")
    if (fullCode.length === 6 && !isVerifying.current) {
      verifyOtpImmediately(fullCode)
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      if (!isVerifying.current) {
        verifyOtpImmediately(pastedData)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtpImmediately = async (code: string) => {
    if (code.length !== 6 || isVerifying.current) return

    isVerifying.current = true
    startLoading("Verifying...")

    try {
      if (!signUp) {
        setError("Sign up not available")
        stopLoading()
        isVerifying.current = false
        return
      }

      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === "complete") {
        setLoadingMessage("Success! Redirecting...")
        await setActiveSignUp({ session: result.createdSessionId })
        handleClose()
        router.push("/home")
      } else {
        setError("Verification incomplete")
        setOtp(["", "", "", "", "", ""])
        otpInputRefs.current[0]?.focus()
        stopLoading()
        isVerifying.current = false
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code")
      setOtp(["", "", "", "", "", ""])
      otpInputRefs.current[0]?.focus()
      stopLoading()
      isVerifying.current = false
    }
  }

  const handleResendCode = async () => {
    if (!canResend || isLoading) return
    startLoading("Sending code...")

    try {
      if (!signUp) {
        setError("Sign up not available")
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
      setError(err.errors?.[0]?.message || "Failed to resend")
      stopLoading()
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid) {
      setError("Enter a valid email")
      return
    }
    startLoading("Sending reset code...")

    try {
      if (!signIn) {
        setError("Not available")
        stopLoading()
        return
      }
      await signIn.create({ strategy: "reset_password_email_code", identifier: email })
      setSuccessMessage("Reset code sent!")
      setStep("reset-code")
      stopLoading()
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to send")
      stopLoading()
    }
  }

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetCode || resetCode.length < 6) {
      setError("Enter the 6-digit code")
      return
    }
    startLoading("Verifying...")

    try {
      if (!signIn) {
        setError("Not available")
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
        setError("Invalid code")
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
      setError("Password must be 8+ characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    startLoading("Resetting...")

    try {
      if (!signIn) {
        setError("Not available")
        stopLoading()
        return
      }
      const result = await signIn.resetPassword({ password: newPassword })
      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId })
        setSuccessMessage("Password reset!")
        setStep("reset-success")
        stopLoading()
      } else {
        setError("Reset incomplete")
        stopLoading()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Reset failed")
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
            transition={{ duration: 0.1 }}
          >
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

            <motion.div
              className="relative w-full max-w-md bg-[#1A1B23] border border-[#2A2B33] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-[#1A1B23]/98 z-50 flex flex-col items-center justify-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05 }}
                  >
                    <Loader2 className="w-10 h-10 text-[#00FFFF] animate-spin" />
                    <p className="text-white font-medium">{loadingMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 text-[#888888] hover:text-white hover:bg-[#2A2B33] rounded-full transition z-10 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="pt-8 pb-4 px-8 text-center">
                <h2 className="text-2xl font-bold text-[#00FFFF] mb-1">
                  {step === "login" && "Welcome Back"}
                  {step === "signup" && "Create Account"}
                  {step === "verification" && "Verify Email"}
                  {step === "forgot-password" && "Reset Password"}
                  {step === "reset-code" && "Enter Code"}
                  {step === "new-password" && "New Password"}
                  {step === "reset-success" && "Success!"}
                </h2>
                <p className="text-[#888888] text-sm">
                  {step === "login" && "Sign in to continue"}
                  {step === "signup" && "Join moBix for free"}
                  {step === "verification" && `Code sent to ${email}`}
                  {step === "forgot-password" && "Enter your email"}
                  {step === "reset-code" && "Check your email"}
                  {step === "new-password" && "Choose a strong password"}
                  {step === "reset-success" && "Password reset complete"}
                </p>
              </div>

              <div className="p-6 pt-2">
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                    {successMessage}
                  </div>
                )}

                {/* Login Form */}
                {step === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#888888] text-sm mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[#2A2B33] bg-[#0B0C10] text-[#00FFFF] focus:ring-[#00FFFF] focus:ring-offset-0"
                        />
                        <span className="text-[#888888] text-sm">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setStep("forgot-password")
                          setError("")
                        }}
                        className="text-[#00FFFF] text-sm hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid || !password}
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
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
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#888888] text-sm mb-1.5">First Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-11 pr-3 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                            placeholder="First"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[#888888] text-sm mb-1.5">Last Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-11 pr-3 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                            placeholder="Last"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <CountrySelect
                        value={country}
                        onChange={setCountry}
                        placeholder={detectedCountry ? `Detected: ${detectedCountry}` : "Select country"}
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full pl-11 pr-12 py-2.5 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            password && !isPasswordValid ? "border-red-500" : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Create password (8+ chars)"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition ${
                            confirmPassword && !doPasswordsMatch
                              ? "border-red-500"
                              : "border-[#2A2B33] focus:border-[#00FFFF]"
                          }`}
                          placeholder="Confirm password"
                          required
                          autoComplete="new-password"
                        />
                      </div>
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
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
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
                        Privacy
                      </Link>
                    </p>
                  </form>
                )}

                {/* OTP Verification */}
                {step === "verification" && (
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <div className="w-14 h-14 rounded-full bg-[#00FFFF]/20 flex items-center justify-center">
                        <Mail className="w-7 h-7 text-[#00FFFF]" />
                      </div>
                    </div>

                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          disabled={isLoading}
                          className="w-11 h-12 text-center text-xl font-bold bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]/30 transition disabled:opacity-50"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {!canResend ? (
                        <p className="text-[#666666] text-sm">
                          Resend in <span className="text-[#00FFFF]">{formatTime(countdown)}</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isLoading}
                          className="text-[#00FFFF] hover:underline font-medium text-sm disabled:opacity-50"
                        >
                          Resend code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("signup")
                        setError("")
                      }}
                      disabled={isLoading}
                      className="w-full py-2 text-[#888888] hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign Up
                    </button>
                  </div>
                )}

                {/* Forgot Password */}
                {step === "forgot-password" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid}
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                    >
                      Send Reset Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("login")
                        setError("")
                      }}
                      className="w-full py-2 text-[#888888] hover:text-white flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                  </form>
                )}

                {/* Reset Code */}
                {step === "reset-code" && (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">6-Digit Code</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || resetCode.length < 6}
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg transition disabled:opacity-50"
                    >
                      Verify Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("forgot-password")
                        setError("")
                      }}
                      className="w-full py-2 text-[#888888] hover:text-white flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </form>
                )}

                {/* New Password */}
                {step === "new-password" && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="New password (8+ chars)"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg transition disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                  </form>
                )}

                {/* Success */}
                {step === "reset-success" && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-[#888888]">Your password has been reset successfully.</p>
                    <button
                      onClick={() => {
                        handleClose()
                        router.push("/home")
                      }}
                      className="w-full py-2.5 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg transition"
                    >
                      Continue to moBix
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
