"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Flag, X, Loader, AlertTriangle, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { reportContent } from "@/lib/server-actions"
import { useUser } from "@clerk/nextjs"

interface ReportContentModalProps {
  movieId: string
  movieTitle: string
  trigger?: React.ReactNode
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "copyright", label: "Copyright Violation" },
  { value: "broken", label: "Broken Video / Not Playing" },
  { value: "wrong_info", label: "Wrong Information" },
  { value: "spam", label: "Spam or Misleading" },
  { value: "other", label: "Other" },
]

export default function ReportContentModal({ movieId, movieTitle, trigger }: ReportContentModalProps) {
  const { user, isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress)
    }
  }, [isSignedIn, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      setError("Please select a reason")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const result = await reportContent(movieId, reason, description, email)

      if (result.success) {
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setReason("")
          setDescription("")
          if (!isSignedIn) setEmail("")
        }, 2000)
      } else {
        setError("Unable to submit report. Please try again.")
      }
    } catch {
      setError("Unable to submit report. Please try again.")
    }

    setIsSubmitting(false)
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23] text-white/70 border border-[#2A2B33] rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all"
        >
          <Flag className="w-4 h-4" />
          <span>Report</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-[#1A1B23] border-t sm:border border-[#2A2B33] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col mb-16 sm:mb-0"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle for mobile */}
              <div className="sm:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-12 h-1.5 bg-white/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2B33] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Report Issue</h3>
                    <p className="text-white/50 text-sm truncate max-w-[180px]">{movieTitle}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {submitted ? (
                  <div className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <h4 className="text-white font-bold text-lg mb-2">Report Submitted</h4>
                    <p className="text-white/50">Thank you for your feedback.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Reason Selection - Compact for mobile */}
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">
                        What's the issue? <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                        {REPORT_REASONS.map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all active:scale-[0.98] ${
                              reason === option.value
                                ? "bg-[#00FFFF]/10 border-[#00FFFF]/50"
                                : "bg-[#0B0C10] border-[#2A2B33] hover:border-[#3A3B43]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="reason"
                              value={option.value}
                              checked={reason === option.value}
                              onChange={(e) => setReason(e.target.value)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                reason === option.value ? "border-[#00FFFF] bg-[#00FFFF]" : "border-[#3A3B43]"
                              }`}
                            >
                              {reason === option.value && <div className="w-1.5 h-1.5 rounded-full bg-[#0B0C10]" />}
                            </div>
                            <span className="text-white text-xs sm:text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">
                        Email {isSignedIn && <span className="text-white/40">(auto-filled)</span>}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        disabled={isSignedIn}
                        className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] disabled:opacity-60 text-base"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Details (Optional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us more..."
                        rows={2}
                        className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] resize-none text-base"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2 pb-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !reason}
                        className="w-full py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Flag className="w-5 h-5" />
                            Submit Report
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
