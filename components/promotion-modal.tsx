"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Gift, Loader2, CheckCircle, Phone, Wifi } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface PromotionSettings {
  isActive: boolean
  enabledCountries: string[]
  headline: string
  subtext: string
  successMessage: string
  networkOptions: Record<string, string[]>
}

interface PromotionModalProps {
  userCountry: string
  settings: PromotionSettings
  onClose?: () => void
  onSuccess?: () => void
  isTargeted?: boolean
  forceShow?: boolean
}

export default function PromotionModal({
  userCountry,
  settings,
  onClose,
  onSuccess,
  isTargeted = false,
  forceShow = false,
}: PromotionModalProps) {
  const { user, isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [network, setNetwork] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [honeypot, setHoneypot] = useState("")

  useEffect(() => {
    if (forceShow || isTargeted) {
      setIsOpen(true)
      return
    }

    // Normal flow - check conditions
    if (!settings.isActive) return
    if (!settings.enabledCountries.includes(userCountry)) return

    // Check localStorage for already shown (only for non-targeted)
    const hasSeenPromo = localStorage.getItem("promo_modal_shown")
    if (hasSeenPromo) return

    // Show modal after a short delay
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [settings, userCountry, isTargeted, forceShow])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (honeypot) return

    if (!phone || !network) {
      setError("Please fill all fields")
      return
    }

    const phoneRegex = /^[\d\s\-+()]{8,20}$/
    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid phone number")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/promotions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          network,
          country: userCountry,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Unable to submit. Please try again.")
        setIsSubmitting(false)
        return
      }

      setSubmitted(true)
      localStorage.setItem("promo_modal_shown", "true")
      onSuccess?.()

      setTimeout(() => {
        setIsOpen(false)
        onClose?.()
      }, 2500)
    } catch {
      setError("Unable to submit. Please try again.")
    }

    setIsSubmitting(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (!isTargeted) {
      localStorage.setItem("promo_modal_shown", "true")
    }
    onClose?.()
  }

  const networks = settings.networkOptions[userCountry] || ["MTN", "Airtel", "Glo", "9mobile", "Other"]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-gradient-to-b from-[#1A1B23] to-[#0B0C10] border border-[#00FFFF]/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          style={{
            boxShadow: "0 0 60px rgba(0, 255, 255, 0.15), 0 20px 40px rgba(0, 0, 0, 0.5)",
          }}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#00FFFF]/20 to-purple-500/20 p-6 pb-8">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FFFF] to-purple-500 flex items-center justify-center">
                <Gift className="w-8 h-8 text-[#0B0C10]" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">{settings.headline}</h2>
            <p className="text-white/60 text-center text-sm">{settings.subtext}</p>
          </div>

          {/* Content */}
          <div className="p-6 -mt-4">
            {submitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Entry Submitted!</h3>
                <p className="text-white/60 text-sm">{settings.successMessage}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div>
                  <label className="block text-white/70 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={isSignedIn ? user?.primaryEmailAddress?.emailAddress || "" : ""}
                    disabled
                    className="w-full px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                    placeholder="Your email"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF]/50 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    <Wifi className="w-4 h-4 inline mr-2" />
                    Network Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {networks.map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                          network === net
                            ? "bg-[#00FFFF]/20 border-[#00FFFF]/50 text-[#00FFFF]"
                            : "bg-[#0B0C10] border-white/10 text-white/70 hover:border-white/20"
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-[#00FFFF] to-cyan-400 text-[#0B0C10] font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FFFF]/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Enter Lucky Draw
                    </>
                  )}
                </button>

                <p className="text-white/40 text-xs text-center">By entering, you agree to our terms and conditions</p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
