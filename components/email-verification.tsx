"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Loader, ArrowLeft } from "lucide-react"

interface EmailVerificationProps {
  email: string
  onVerified: () => void
  onBack: () => void
  isLoading?: boolean
}

export default function EmailVerification({ email, onVerified, onBack, isLoading = false }: EmailVerificationProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsVerifying(true)

    try {
      if (!code || code.length < 6) {
        setError("Please enter a valid verification code")
        setIsVerifying(false)
        return
      }

      // Simulate verification - in real app, this would call Clerk's verification method
      // For now, we'll just call onVerified after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onVerified()
    } catch (err: any) {
      setError(err.message || "Verification failed")
      setIsVerifying(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-[#00FFFF]/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#00FFFF]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-[#888888] text-sm">
          We've sent a verification code to <span className="text-[#00FFFF]">{email}</span>
        </p>
      </div>

      {error && (
        <motion.div
          className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-white mb-2">Verification Code</label>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] text-center text-2xl tracking-widest focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
          />
        </motion.div>

        <motion.button
          type="submit"
          disabled={isVerifying || isLoading}
          className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ scale: isVerifying || isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isVerifying || isLoading ? 1 : 0.98 }}
        >
          {isVerifying || isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Email</span>
          )}
        </motion.button>
      </form>

      <motion.button
        type="button"
        onClick={onBack}
        disabled={isVerifying || isLoading}
        className="w-full py-2 text-[#888888] hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sign Up</span>
      </motion.button>

      <p className="text-center text-[#666666] text-xs">
        Didn't receive the code? <button className="text-[#00FFFF] hover:text-[#00CCCC]">Resend</button>
      </p>
    </motion.div>
  )
}
