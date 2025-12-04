"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, Key, CheckCircle } from "lucide-react"
import { useSignUp, useSignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import EmailVerification from "./email-verification"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true) // Default to login
  const [step, setStep] = useState<
    "login" | "signup" | "verification" | "forgot-password" | "reset-code" | "new-password" | "reset-success"
  >("login")
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

  const { signUp, setActive: setActiveSignUp } = useSignUp()
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const savedEmail = localStorage.getItem("mobix_remembered_email")
    const savedRememberMe = localStorage.getItem("mobix_remember_me") === "true"
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // Custom close handler to reset state
  const handleClose = () => {
    onClose()
    // Reset state to initial values
    setIsLogin(true)
    setStep("login")
    setShowPassword(false)
    setRememberMe(false)
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setResetCode("")
    setNewPassword("")
    setFirstName("")
    setLastName("")
    setError("")
    setSuccessMessage("")
    setIsLoading(false)
  }

  if (!isOpen || !isLoaded) return null

  const handleLogin = async (e: React.FormEvent) => {
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
        if (rememberMe) {
          localStorage.setItem("mobix_remembered_email", email)
          localStorage.setItem("mobix_remember_me", "true")
        } else {
          localStorage.removeItem("mobix_remembered_email")
          localStorage.removeItem("mobix_remember_me")
        }

        await setActiveSignIn({ session: result.createdSessionId })
        router.push("/home")
        handleClose()
      } else {
        setError("Sign in incomplete. Please try again.")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters")
        setIsLoading(false)
        return
      }

      if (!signUp) {
        setError("Sign up is not available")
        setIsLoading(false)
        return
      }

      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setStep("verification")
      setIsLoading(false)
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed")
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (!signIn) {
        setError("Password reset is not available")
        setIsLoading(false)
        return
      }

      if (!email) {
        setError("Please enter your email address")
        setIsLoading(false)
        return
      }

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })

      setSuccessMessage("Reset code sent! Check your email.")
      setStep("reset-code")
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to send reset code. Please check your email address.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!signIn) {
        setError("Password reset is not available")
        setIsLoading(false)
        return
      }

      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
      })

      if (result.status === "needs_second_factor") {
        setStep("new-password")
      } else {
        setError("Invalid code. Please try again.")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to verify code. Please check your code.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!signIn) {
        setError("Password reset is not available")
        setIsLoading(false)
        return
      }

      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters")
        setIsLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match")
        setIsLoading(false)
        return
      }

      const result = await signIn.updatePassword({
        resetPasswordTriggerCode: resetCode,
        password: newPassword,
      })

      if (result.status === "complete") {
        setSuccessMessage("Password reset successful!")
        setStep("reset-success")
      } else {
        setError("Password reset incomplete. Please try again.")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to reset password. Please check your code.")
    } finally {
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
        handleClose()
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed")
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-[#888888] hover:text-white hover:bg-[#2A2B33] rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pt-8 pb-4 px-8 text-center">
              <motion.h2
                className="text-3xl font-bold text-[#00FFFF] mb-2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {step === "login" && "Welcome Back"}
                {step === "signup" && "Create Account"}
                {step === "forgot-password" && "Reset Password"}
                {step === "reset-code" && "Enter Code"}
                {step === "new-password" && "New Password"}
                {step === "reset-success" && "Success!"}
              </motion.h2>
              <motion.p
                className="text-[#888888]"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {step === "login" && "Sign in to continue watching"}
                {step === "signup" && "Join moBix for free"}
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
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[#888888] text-sm">Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Enter your password"
                        required
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
                    disabled={isLoading}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
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
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#888888] text-sm mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#888888] text-sm mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Create a password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[#666666] text-xs mt-1">Minimum 8 characters</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
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
                </form>
              )}

              {/* Forgot Password Form */}
              {step === "forgot-password" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("login")
                      setError("")
                      setSuccessMessage("")
                    }}
                    className="flex items-center gap-2 text-[#888888] hover:text-white transition mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>

                  <div>
                    <label className="block text-[#888888] text-sm mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <p className="text-[#666666] text-xs mt-2">We'll send a verification code to this email address</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending code...
                      </span>
                    ) : (
                      "Send Reset Code"
                    )}
                  </button>
                </form>
              )}

              {/* Reset Code Form */}
              {step === "reset-code" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("forgot-password")
                      setError("")
                      setSuccessMessage("")
                    }}
                    className="flex items-center gap-2 text-[#888888] hover:text-white transition mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div>
                    <label className="block text-[#888888] text-sm mb-2">Verification Code</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-[#666666] text-xs mt-2">Enter the 6-digit code sent to {email}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || resetCode.length !== 6}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify Code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="w-full py-2 text-[#888888] hover:text-[#00FFFF] text-sm transition"
                  >
                    Didn't receive the code? Resend
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
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[#666666] text-xs mt-1">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-[#888888] text-sm mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] transition"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Resetting password...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}

              {/* Reset Success */}
              {step === "reset-success" && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-[#888888]">Your password has been reset successfully.</p>
                  <button
                    onClick={() => {
                      setStep("login")
                      setError("")
                      setSuccessMessage("")
                    }}
                    className="w-full py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                  >
                    Sign In Now
                  </button>
                </div>
              )}

              {/* Terms notice for signup */}
              {step === "signup" && (
                <p className="text-[#666666] text-xs text-center mt-4">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-[#00FFFF] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#00FFFF] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              )}

              {/* Email Verification Form (if needed) */}
              {step === "verification" && !isLogin && (
                <EmailVerification
                  email={email}
                  onVerified={handleVerificationComplete}
                  onBack={() => {
                    setStep("signup")
                    setError("")
                  }}
                  isLoading={isLoading}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
