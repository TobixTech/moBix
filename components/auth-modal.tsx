"use client"

import type React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSignUp, useSignIn, useClerk } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, Eye, EyeOff, User, Loader2, ArrowLeft, Check, Globe, ChevronDown, Search } from "lucide-react"
import { countries } from "@/lib/countries"

interface AuthModalProps {
  trigger: React.ReactNode
  defaultMode?: "login" | "signup"
}

export function AuthModal({ trigger, defaultMode = "login" }: AuthModalProps) {
  const router = useRouter()
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp()
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn()
  const { signOut } = useClerk()

  const isLoaded = signUpLoaded && signInLoaded

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"login" | "signup">(defaultMode)
  const [step, setStep] = useState<
    "form" | "verification" | "forgot" | "reset-code" | "new-password" | "reset-success"
  >("form")

  // Form fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [country, setCountry] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const isVerifying = useRef(false)

  // Reset password
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)

  // Country dropdown ref for click outside
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries.slice(0, 10)
    return countries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase()),
      )
      .slice(0, 10)
  }, [countrySearch])

  // Get selected country
  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.code === country)
  }, [country])

  // Validation
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])
  const isPasswordValid = useMemo(() => password.length >= 8, [password])
  const doPasswordsMatch = useMemo(() => password === confirmPassword, [password, confirmPassword])

  // Auto-detect country on mount
  useEffect(() => {
    if (!country && isOpen && mode === "signup") {
      fetch("/api/detect-country")
        .then((res) => res.json())
        .then((data) => {
          if (data.countryCode) {
            setCountry(data.countryCode)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, mode, country])

  // Click outside to close country dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && step === "verification") {
      setCanResend(true)
    }
  }, [countdown, step])

  // Remember me
  useEffect(() => {
    const remembered = localStorage.getItem("remembered_email")
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setMode(defaultMode)
    setStep("form")
    setError("")
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep("form")
    setError("")
    setLoadingMessage("")
    setOtp(["", "", "", "", "", ""])
  }

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
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: { country },
      })

      setLoadingMessage("Sending verification code...")
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setStep("verification")
      setCountdown(120)
      setCanResend(false)

      // Focus first OTP input after transition
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
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

        setLoadingMessage("Redirecting...")
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

  // OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when complete
    const fullCode = newOtp.join("")
    if (fullCode.length === 6 && !isVerifying.current) {
      handleVerifyOtp(fullCode)
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
        setLoadingMessage("Success! Redirecting...")
        await setActiveSignUp({ session: result.createdSessionId })
        handleClose()
        router.push("/home")
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Invalid code"
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
    } catch {
      setError("Failed to resend code")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  // Forgot password handlers
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

  // Loading state while Clerk loads
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

  return (
    <>
      <div onClick={handleOpen}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90">
                <Loader2 className="w-12 h-12 text-[#00FFFF] animate-spin mb-4" />
                <p className="text-white text-lg font-medium">{loadingMessage}</p>
              </div>
            )}

            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-[#1A1B23] to-[#0B0C10] rounded-2xl border border-[#2A2B33] shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 pt-12">
                {/* Header */}
                {step === "form" && (
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {mode === "login" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-white/60">{mode === "login" ? "Sign in to continue" : "Join us today"}</p>
                  </div>
                )}

                {step === "verification" && (
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
                    <p className="text-white/60">Enter the 6-digit code sent to {email}</p>
                  </div>
                )}

                {/* Error/Success messages */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
                    {successMessage}
                  </div>
                )}

                {/* Login Form */}
                {step === "form" && mode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[#2A2B33] bg-[#0B0C10] text-[#00FFFF] focus:ring-[#00FFFF]"
                        />
                        <span className="text-sm text-white/60">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep("forgot")}
                        className="text-sm text-[#00FFFF] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all disabled:opacity-50"
                    >
                      Sign In
                    </button>

                    <p className="text-center text-white/60">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup")
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
                {step === "form" && mode === "signup" && (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full pl-11 pr-3 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                    </div>

                    <div className="relative" ref={countryDropdownRef}>
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full pl-11 pr-10 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-left text-white focus:outline-none focus:border-[#00FFFF] transition-colors"
                      >
                        {selectedCountry ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span>{selectedCountry.name}</span>
                          </span>
                        ) : (
                          <span className="text-white/40">Select your country</span>
                        )}
                      </button>
                      <ChevronDown
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`}
                      />

                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1B23] border border-[#2A2B33] rounded-xl shadow-xl z-50 max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-[#2A2B33]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-9 pr-3 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00FFFF]"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setCountry(c.code)
                                  setShowCountryDropdown(false)
                                  setCountrySearch("")
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-[#2A2B33] transition-colors flex items-center gap-3 ${country === c.code ? "bg-[#00FFFF]/10 text-[#00FFFF]" : "text-white"}`}
                              >
                                <span className="text-lg">{c.flag}</span>
                                <span>{c.name}</span>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div className="px-4 py-3 text-white/40 text-center">No countries found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 8 characters)"
                        className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                      {confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {doPasswordsMatch ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all disabled:opacity-50"
                    >
                      Create Account
                    </button>

                    <p className="text-center text-white/60">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login")
                          setError("")
                        }}
                        className="text-[#00FFFF] hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                )}

                {/* OTP Verification */}
                {step === "verification" && (
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
                          className="w-12 h-14 text-center text-2xl font-bold bg-[#0B0C10] border-2 border-[#2A2B33] rounded-xl text-white focus:outline-none focus:border-[#00FFFF] transition-colors"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {countdown > 0 ? (
                        <p className="text-white/60">
                          Resend code in{" "}
                          <span className="text-[#00FFFF]">
                            {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                          </span>
                        </p>
                      ) : (
                        <button
                          onClick={handleResendCode}
                          disabled={!canResend || isLoading}
                          className="text-[#00FFFF] hover:underline disabled:opacity-50"
                        >
                          Resend code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("form")
                        setOtp(["", "", "", "", "", ""])
                        setError("")
                      }}
                      className="w-full py-3 border border-[#2A2B33] text-white rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to signup
                    </button>
                  </div>
                )}

                {/* Forgot Password */}
                {step === "forgot" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                      <p className="text-white/60">Enter your email to receive a reset code</p>
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all disabled:opacity-50"
                    >
                      Send Reset Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("form")
                        setError("")
                      }}
                      className="w-full py-3 border border-[#2A2B33] text-white rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to login
                    </button>
                  </form>
                )}

                {/* Reset Code */}
                {step === "reset-code" && (
                  <form onSubmit={handleVerifyResetCode} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">Enter Code</h2>
                      <p className="text-white/60">Check your email for the 6-digit code</p>
                    </div>

                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white text-center text-xl tracking-widest placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                      maxLength={6}
                    />

                    <button
                      type="submit"
                      disabled={isLoading || resetCode.length !== 6}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all disabled:opacity-50"
                    >
                      Verify Code
                    </button>
                  </form>
                )}

                {/* New Password */}
                {step === "new-password" && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">New Password</h2>
                      <p className="text-white/60">Enter your new password</p>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 8 characters)"
                        className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#00FFFF] transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                  </form>
                )}

                {/* Reset Success */}
                {step === "reset-success" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                    <p className="text-white/60">Redirecting you now...</p>
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

export default AuthModal
