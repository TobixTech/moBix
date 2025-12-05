"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle,
  User,
  Globe,
  ChevronDown,
  Search,
} from "lucide-react"
import { useSignIn, useSignUp, useClerk } from "@clerk/nextjs"
import { countries } from "@/lib/countries"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "sign-in" | "sign-up"
}

const COUNTRY_LIST = countries.map((c) => ({ code: c.code, name: c.name, flag: c.flag }))

export default function AuthModal({ isOpen, onClose, defaultMode = "sign-in" }: AuthModalProps) {
  const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp()
  const { client } = useClerk()

  const [mode, setMode] = useState<"sign-in" | "sign-up">(defaultMode)
  const [step, setStep] = useState<"form" | "verification">("form")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [country, setCountry] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(120)
  const [canResend, setCanResend] = useState(false)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const isVerifyingRef = useRef(false)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Memoized validations
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])
  const isPasswordValid = useMemo(() => password.length >= 8, [password])
  const doPasswordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword])

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_LIST
    const search = countrySearch.toLowerCase()
    return COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search))
  }, [countrySearch])

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-detect country on mount
  useEffect(() => {
    if (!country && mode === "sign-up") {
      fetch("/api/detect-country")
        .then((res) => res.json())
        .then((data) => {
          if (data.country && COUNTRY_LIST.some((c) => c.name === data.country)) {
            setCountry(data.country)
          }
        })
        .catch(() => {})
    }
  }, [country, mode])

  // Countdown timer for OTP
  useEffect(() => {
    if (step === "verification" && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
      return () => clearInterval(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [step, countdown])

  // Reset on modal open
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
      setStep("form")
      setError("")
      setOtp(["", "", "", "", "", ""])
      isVerifyingRef.current = false
    }
  }, [isOpen, defaultMode])

  const verifyOtp = useCallback(
    async (code: string) => {
      if (isVerifyingRef.current || code.length !== 6 || !signUp) return

      isVerifyingRef.current = true
      setIsLoading(true)
      setLoadingMessage("Verifying...")
      setError("")

      try {
        const result = await signUp.attemptEmailAddressVerification({ code })

        if (result.status === "complete" && result.createdSessionId) {
          setLoadingMessage("Success! Redirecting...")
          await setSignUpActive({ session: result.createdSessionId })

          onClose()
          window.location.href = "/home"
        } else {
          setError("Verification incomplete. Please try again.")
          isVerifyingRef.current = false
        }
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Invalid code"
        setError(msg)
        setOtp(["", "", "", "", "", ""])
        otpInputRefs.current[0]?.focus()
        isVerifyingRef.current = false
      } finally {
        setIsLoading(false)
        setLoadingMessage("")
      }
    },
    [signUp, setSignUpActive, onClose],
  )

  // OTP input handler with auto-verify
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return

      const newOtp = [...otp]
      newOtp[index] = value.slice(-1)
      setOtp(newOtp)

      // Auto-advance to next input
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus()
      }

      // Auto-verify when all 6 digits entered
      const fullCode = newOtp.join("")
      if (fullCode.length === 6) {
        verifyOtp(fullCode)
      }
    },
    [otp, verifyOtp],
  )

  // Handle OTP paste
  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
      if (pasted.length === 6) {
        const newOtp = pasted.split("")
        setOtp(newOtp)
        verifyOtp(pasted)
      }
    },
    [verifyOtp],
  )

  // Handle OTP backspace
  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus()
      }
    },
    [otp],
  )

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    // Quick validation
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
      const createPromise = signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        unsafeMetadata: { country },
      })

      await createPromise

      setStep("verification")
      setCountdown(120)
      setCanResend(false)
      setLoadingMessage("Sending code...")

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50)
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Sign up failed"
      setError(msg)
      setStep("form")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    if (!isEmailValid) {
      setError("Please enter a valid email")
      return
    }
    if (!password) {
      setError("Please enter your password")
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
        setLoadingMessage("Success!")
        await setSignInActive({ session: result.createdSessionId })

        onClose()
        window.location.href = "/home"
      } else {
        setError("Sign in incomplete. Please try again.")
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Sign in failed"
      setError(msg)
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (!signUp || !canResend) return

    setIsLoading(true)
    setLoadingMessage("Resending code...")

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setCountdown(120)
      setCanResend(false)
      setOtp(["", "", "", "", "", ""])
    } catch (err: any) {
      setError("Failed to resend code")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  // Google sign-in
  const handleGoogleSignIn = async () => {
    if (!client) return

    setIsLoading(true)
    setLoadingMessage("Connecting to Google...")

    try {
      const redirectUrl = window.location.origin + "/sso-callback"
      const signInOrUp = mode === "sign-in" ? signIn : signUp

      await signInOrUp?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl,
        redirectUrlComplete: "/home",
      })
    } catch (err: any) {
      setError("Google sign-in failed")
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const selectedCountry = COUNTRY_LIST.find((c) => c.name === country)

  if (!isOpen) return null

  const isClerkLoaded = mode === "sign-in" ? signInLoaded : signUpLoaded

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Loader2 className="w-10 h-10 text-[#00FFFF] animate-spin mb-4" />
              <p className="text-white text-lg">{loadingMessage || "Please wait..."}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="bg-gradient-to-b from-[#1A1B23] to-[#0B0C10] border border-[#00FFFF]/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isClerkLoaded ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>

                <h2 className="text-2xl font-bold text-white">
                  {step === "verification" ? "Verify Email" : mode === "sign-in" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  {step === "verification"
                    ? `Enter the 6-digit code sent to ${email}`
                    : mode === "sign-in"
                      ? "Sign in to continue"
                      : "Join us today"}
                </p>
              </div>

              <div className="p-6 pt-0">
                {step === "verification" ? (
                  /* OTP Verification */
                  <div className="space-y-6">
                    <div className="flex justify-center gap-2">
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
                          onPaste={handleOtpPaste}
                          className="w-12 h-14 text-center text-xl font-bold bg-[#0B0C10] border-2 border-white/20 rounded-xl text-white focus:border-[#00FFFF] focus:outline-none transition"
                          disabled={isLoading}
                        />
                      ))}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                      </div>
                    )}

                    <div className="text-center">
                      {canResend ? (
                        <button
                          onClick={handleResendOtp}
                          className="text-[#00FFFF] hover:underline text-sm"
                          disabled={isLoading}
                        >
                          Resend Code
                        </button>
                      ) : (
                        <p className="text-white/50 text-sm">
                          Resend code in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setStep("form")
                        setOtp(["", "", "", "", "", ""])
                        isVerifyingRef.current = false
                      }}
                      className="w-full text-white/60 hover:text-white text-sm transition"
                    >
                      Back to sign up
                    </button>
                  </div>
                ) : (
                  /* Sign In / Sign Up Form */
                  <form onSubmit={mode === "sign-in" ? handleSignin : handleSignup} className="space-y-4">
                    {/* Google Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-3 bg-white text-gray-800 font-medium rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition"
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-white/40 text-sm">or</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Name fields for sign up */}
                    {mode === "sign-up" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 text-sm mb-1.5">First Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-[#0B0C10] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF]/50 transition"
                              placeholder="John"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm mb-1.5">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF]/50 transition"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-[#0B0C10] border rounded-xl text-white placeholder-white/30 focus:outline-none transition ${
                            email && !isEmailValid ? "border-red-500/50" : "border-white/10 focus:border-[#00FFFF]/50"
                          }`}
                          placeholder="you@example.com"
                          required
                        />
                        {email && isEmailValid && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </div>

                    {/* Country - Sign Up Only */}
                    {mode === "sign-up" && (
                      <div ref={countryDropdownRef}>
                        <label className="block text-white/70 text-sm mb-1.5">Country *</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className={`w-full px-4 py-3 bg-[#0B0C10] border rounded-xl text-left flex items-center justify-between transition ${
                              !country ? "border-white/10" : "border-[#00FFFF]/30"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Globe className="w-5 h-5 text-white/40" />
                              {selectedCountry ? (
                                <>
                                  <span className="text-lg">{selectedCountry.flag}</span>
                                  <span className="text-white">{selectedCountry.name}</span>
                                </>
                              ) : (
                                <span className="text-white/40">Select your country</span>
                              )}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-white/40 transition ${countryDropdownOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {countryDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 bg-[#1A1B23] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-hidden">
                              <div className="p-2 border-b border-white/10">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                  <input
                                    type="text"
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    placeholder="Search country..."
                                    className="w-full pl-9 pr-3 py-2 bg-[#0B0C10] border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00FFFF]/50"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredCountries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setCountry(c.name)
                                      setCountryDropdownOpen(false)
                                      setCountrySearch("")
                                    }}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-white/5 transition ${
                                      country === c.name ? "bg-[#00FFFF]/10 text-[#00FFFF]" : "text-white"
                                    }`}
                                  >
                                    <span className="text-lg">{c.flag}</span>
                                    <span>{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label className="block text-white/70 text-sm mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 bg-[#0B0C10] border rounded-xl text-white placeholder-white/30 focus:outline-none transition ${
                            password && !isPasswordValid && mode === "sign-up"
                              ? "border-red-500/50"
                              : "border-white/10 focus:border-[#00FFFF]/50"
                          }`}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5 text-white/40" />
                          ) : (
                            <Eye className="w-5 h-5 text-white/40" />
                          )}
                        </button>
                      </div>
                      {mode === "sign-up" && password && !isPasswordValid && (
                        <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
                      )}
                    </div>

                    {/* Confirm Password - Sign Up Only */}
                    {mode === "sign-up" && (
                      <div>
                        <label className="block text-white/70 text-sm mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-12 py-3 bg-[#0B0C10] border rounded-xl text-white placeholder-white/30 focus:outline-none transition ${
                              confirmPassword && !doPasswordsMatch
                                ? "border-red-500/50"
                                : "border-white/10 focus:border-[#00FFFF]/50"
                            }`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5 text-white/40" />
                            ) : (
                              <Eye className="w-5 h-5 text-white/40" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && !doPasswordsMatch && (
                          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                        )}
                      </div>
                    )}

                    {/* Remember Me */}
                    {mode === "sign-in" && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-[#0B0C10] text-[#00FFFF] focus:ring-[#00FFFF]/50"
                          />
                          <span className="text-white/60 text-sm">Remember me</span>
                        </label>
                        <button type="button" className="text-[#00FFFF] text-sm hover:underline">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#00FFFF] to-cyan-400 text-[#0B0C10] font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FFFF]/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {mode === "sign-in" ? "Sign In" : "Continue"}
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Toggle Mode */}
                    <p className="text-center text-white/60 text-sm">
                      {mode === "sign-in" ? "Don't have an account?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode(mode === "sign-in" ? "sign-up" : "sign-in")
                          setError("")
                        }}
                        className="text-[#00FFFF] hover:underline"
                      >
                        {mode === "sign-in" ? "Sign Up" : "Sign In"}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
