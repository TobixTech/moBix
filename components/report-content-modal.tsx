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
      setError(result.error || "Failed to submit report")
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-[#1A1B23] border border-[#2A2B33] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2B33]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Report Content</h3>
                    <p className="text-white/50 text-sm truncate max-w-[180px] sm:max-w-[200px]">{movieTitle}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Content */}
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
                  <p className="text-white/50">Thank you for helping us maintain quality content.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Reason for Report <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {REPORT_REASONS.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
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
                            {reason === option.value && <div className="w-2 h-2 rounded-full bg-[#0B0C10]" />}
                          </div>
                          <span className="text-white text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Your Email {isSignedIn && <span className="text-white/40 text-sm">(auto-filled)</span>}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com (for updates)"
                      disabled={isSignedIn}
                      className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Additional Details (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more details about the issue..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
