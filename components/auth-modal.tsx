"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Key,
  CheckCircle,
  Globe,
  ChevronDown,
} from "lucide-react"
import { useSignUp, useSignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { countries } from "@/lib/countries"

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
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const isVerifying = useRef(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  const { signUp, setActive: setActiveSignUp } = useSignUp()
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded } = useAuth()
  const router = useRouter()

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()),
    )
  }, [countrySearch])

  useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch("/api/get-ip")
        const data = await res.json()
        if (data.country && !country) {
          setCountry(data.country)
        }
      } catch {
        // Silently fail
      }
    }
    detectCountry()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Validation helpers
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email), [email])
  const isPasswordValid = useMemo(() => password.length >= 8, [password])
  const doPasswordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword])

  // OTP countdown
  useEffect(() => {
    if (step === "verification" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, step])

  // Auto-focus OTP input when verification step
  useEffect(() => {
    if (step === "verification") {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    }
  }, [step])

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleClose = useCallback(() => {
    setStep(defaultTab)
    setError("")
    setSuccessMessage("")
    onClose()
  }, [defaultTab, onClose])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return

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

    setIsLoading(true)
    setLoadingMessage("Creating account...")
    setError("")

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          country, // Store country in metadata
        },
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setStep("verification")
      setCountdown(120)
      setCanResend(false)
      setLoadingMessage("")
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Sign up failed"
      setError(msg)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Signing in...")
    setError("")

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === "complete") {
        if (rememberMe) {
          localStorage.setItem("remembered_email", email)
        } else {
          localStorage.removeItem("remembered_email")
        }
        await setActiveSignIn({ session: result.createdSessionId })
        handleClose()
        router.push("/home")
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Login failed"
      setError(msg)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
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

    // Auto-verify when all 6 digits entered
    const fullOtp = newOtp.join("")
    if (fullOtp.length === 6 && !isVerifying.current) {
      handleVerifyOtp(fullOtp)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      if (!isVerifying.current) {
        handleVerifyOtp(pastedData)
      }
    }
  }

  const handleVerifyOtp = async (code: string) => {
    if (!signUp || isVerifying.current) return

    isVerifying.current = true
    setIsLoading(true)
    setLoadingMessage("Verifying...")
    setError("")

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId })
        handleClose()
        router.push("/home")
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Verification failed"
      setError(msg)
      setOtp(["", "", "", "", "", ""])
      otpInputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
      isVerifying.current = false
    }
  }

  const handleResendCode = async () => {
    if (!signUp || !canResend) return

    setIsLoading(true)
    setLoadingMessage("Sending code...")

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setCountdown(120)
      setCanResend(false)
      setSuccessMessage("Code sent!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError("Failed to resend code")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    if (!isEmailValid) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Sending reset code...")
    setError("")

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })
      setStep("reset-code")
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Failed to send reset code"
      setError(msg)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    if (resetCode.length !== 6) {
      setError("Please enter the 6-digit code")
      return
    }

    setStep("new-password")
    setError("")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Resetting password...")
    setError("")

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      })

      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId })
        setStep("reset-success")
        setTimeout(() => {
          handleClose()
          router.push("/home")
        }, 2000)
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Failed to reset password"
      setError(msg)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  if (!isLoaded) {
    return (
      <>
        {trigger}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  const selectedCountry = countries.find((c) => c.name === country)

  return (
    <>
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
          >
            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && loadingMessage && (
                <motion.div
                  className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#00FFFF] animate-spin" />
                    <p className="text-white font-medium">{loadingMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2B33]">
                <h2 className="text-xl font-bold text-white">
                  {step === "login" && "Welcome Back"}
                  {step === "signup" && "Create Account"}
                  {step === "verification" && "Verify Email"}
                  {step === "forgot-password" && "Reset Password"}
                  {step === "reset-code" && "Enter Code"}
                  {step === "new-password" && "New Password"}
                  {step === "reset-success" && "Success"}
                </h2>
                <button onClick={handleClose} className="p-2 hover:bg-[#2A2B33] rounded-lg transition">
                  <X className="w-5 h-5 text-[#888888]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
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
                          className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
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
                          className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
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
                          className="w-4 h-4 rounded border-[#2A2B33] bg-[#0B0C10] text-[#00FFFF] focus:ring-[#00FFFF]"
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
                      disabled={isLoading || !email || !password}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
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

                    {/* Email field - moved to be first after names */}
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
                      {email && !isEmailValid && (
                        <p className="text-red-400 text-xs mt-1">Please enter a valid email</p>
                      )}
                    </div>

                    {/* Country field - right after email */}
                    <div ref={countryDropdownRef}>
                      <label className="block text-[#888888] text-sm mb-1.5">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="w-full pl-11 pr-10 py-2.5 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-left focus:outline-none focus:border-[#00FFFF] transition"
                        >
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                          {selectedCountry ? (
                            <span className="text-white flex items-center gap-2">
                              <span className="text-lg">{selectedCountry.flag}</span>
                              {selectedCountry.name}
                            </span>
                          ) : (
                            <span className="text-[#666666]">Select your country</span>
                          )}
                          <ChevronDown
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888] transition ${showCountryDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0B0C10] border border-[#2A2B33] rounded-lg shadow-xl z-50 max-h-60 overflow-hidden">
                            <div className="p-2 border-b border-[#2A2B33]">
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] text-sm"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredCountries.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setCountry(c.name)
                                    setShowCountryDropdown(false)
                                    setCountrySearch("")
                                  }}
                                  className={`w-full px-3 py-2.5 text-left hover:bg-[#2A2B33] flex items-center gap-3 transition ${country === c.name ? "bg-[#00FFFF]/10 text-[#00FFFF]" : "text-white"}`}
                                >
                                  <span className="text-lg">{c.flag}</span>
                                  <span className="text-sm">{c.name}</span>
                                </button>
                              ))}
                              {filteredCountries.length === 0 && (
                                <p className="px-3 py-4 text-[#666666] text-sm text-center">No countries found</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password field */}
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
                      {password && !isPasswordValid && (
                        <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
                      )}
                    </div>

                    {/* Confirm Password field */}
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
                        className="text-[#00FFFF] hover:underline"
                      >
                        Login
                      </button>
                    </p>
                  </form>
                )}

                {/* OTP Verification */}
                {step === "verification" && (
                  <div className="space-y-4">
                    <p className="text-[#888888] text-sm text-center">
                      Enter the 6-digit code sent to <span className="text-white">{email}</span>
                    </p>

                    <div className="flex justify-center gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          className="w-11 h-12 text-center text-xl font-bold bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {canResend ? (
                        <button
                          onClick={handleResendCode}
                          disabled={isLoading}
                          className="text-[#00FFFF] text-sm hover:underline"
                        >
                          Resend Code
                        </button>
                      ) : (
                        <p className="text-[#888888] text-sm">
                          Resend in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setStep("signup")
                        setOtp(["", "", "", "", "", ""])
                      }}
                      className="w-full py-2.5 border border-[#2A2B33] text-[#888888] rounded-lg hover:bg-[#2A2B33] transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign Up
                    </button>
                  </div>
                )}

                {/* Forgot Password */}
                {step === "forgot-password" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-[#888888] text-sm">
                      Enter your email and we'll send you a code to reset your password.
                    </p>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
                    >
                      Send Reset Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("login")
                        setError("")
                      }}
                      className="w-full py-2.5 border border-[#2A2B33] text-[#888888] rounded-lg hover:bg-[#2A2B33] transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                  </form>
                )}

                {/* Reset Code */}
                {step === "reset-code" && (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <p className="text-[#888888] text-sm text-center">
                      Enter the 6-digit code sent to <span className="text-white">{email}</span>
                    </p>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">Reset Code</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] text-center tracking-[0.5em] font-mono text-xl"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetCode.length !== 6}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
                    >
                      Verify Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("forgot-password")
                        setResetCode("")
                      }}
                      className="w-full py-2.5 border border-[#2A2B33] text-[#888888] rounded-lg hover:bg-[#2A2B33] transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </form>
                )}

                {/* New Password */}
                {step === "new-password" && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-[#888888] text-sm">Create a new password for your account.</p>

                    <div>
                      <label className="block text-[#888888] text-sm mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
                          placeholder="Enter new password (8+ chars)"
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

                    <button
                      type="submit"
                      disabled={isLoading || newPassword.length < 8}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                  </form>
                )}

                {/* Reset Success */}
                {step === "reset-success" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Password Reset!</h3>
                    <p className="text-[#888888] text-sm">Redirecting you to home...</p>
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
