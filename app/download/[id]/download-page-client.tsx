"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Shield, Clock, CheckCircle, ExternalLink, Film, Calendar, Tag, UserCheck } from "lucide-react"
import Link from "next/link"

interface Movie {
  id: string
  title: string
  year: number
  genre: string
  posterUrl: string
  downloadUrl?: string
}

interface AdSettings {
  smartLinkUrl?: string
  horizontalAdCode?: string
  verticalAdCode?: string
  showDownloadPageAds?: boolean
}

export default function DownloadPageClient({
  movie,
  adSettings,
}: {
  movie: Movie
  adSettings: AdSettings | null
}) {
  const [step, setStep] = useState(1)
  const [countdown, setCountdown] = useState(0)
  const [verificationStep, setVerificationStep] = useState(1) // 1 or 2
  const [verification1Complete, setVerification1Complete] = useState(false)
  const [verification2Complete, setVerification2Complete] = useState(false)
  const [canDownload, setCanDownload] = useState(false)

  const smartLinkUrl = adSettings?.smartLinkUrl || "https://www.profitablecreativegatetocontent.com/smartlink/?a=259210"

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && step === 2) {
      if (verificationStep === 1) {
        setVerification1Complete(true)
        setVerificationStep(2)
        setStep(1) // Go back to step 1 for second verification
      } else if (verificationStep === 2) {
        setVerification2Complete(true)
        setStep(3)
        setCanDownload(true)
      }
    }
  }, [countdown, step, verificationStep])

  const handleVerificationClick = () => {
    // Open ad in new tab
    window.open(smartLinkUrl, "_blank")

    // Start countdown after ad click
    setStep(2)
    setCountdown(10) // 10 second countdown
  }

  const handleDownload = () => {
    if (canDownload && movie.downloadUrl) {
      window.open(movie.downloadUrl, "_blank")
    }
  }

  const getCurrentVerificationNumber = () => {
    if (!verification1Complete) return 1
    if (!verification2Complete) return 2
    return 2
  }

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Movie Info Header */}
        <motion.div
          className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-[#1A1B23] border border-[#2A2B33] rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={movie.posterUrl || "/placeholder.svg?height=192&width=128"}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex flex-wrap gap-4 text-[#888888] text-sm mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {movie.year}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {movie.genre}
              </span>
            </div>
            <Link href={`/movie/${movie.id}`} className="inline-flex items-center gap-2 text-[#00FFFF] hover:underline">
              <Film className="w-4 h-4" />
              Watch Online Instead
            </Link>
          </div>
        </motion.div>

        {/* Verification Progress */}
        <motion.div
          className="mb-8 p-4 bg-[#1A1B23] border border-[#2A2B33] rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Human Verification Progress</span>
            <span className="text-[#00FFFF] font-bold">
              {verification1Complete && verification2Complete ? "2/2" : verification1Complete ? "1/2" : "0/2"}
            </span>
          </div>
          <div className="flex gap-2">
            <div className={`flex-1 h-2 rounded-full ${verification1Complete ? "bg-green-500" : "bg-[#2A2B33]"}`} />
            <div className={`flex-1 h-2 rounded-full ${verification2Complete ? "bg-green-500" : "bg-[#2A2B33]"}`} />
          </div>
        </motion.div>

        {/* Download Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Step 1: Human Verification */}
          <motion.div
            className={`p-6 rounded-2xl border transition-all ${
              step === 1 && !canDownload
                ? "bg-[#00FFFF]/10 border-[#00FFFF]"
                : verification1Complete && verification2Complete
                  ? "bg-green-500/10 border-green-500"
                  : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  verification1Complete && verification2Complete ? "bg-green-500" : "bg-[#00FFFF]"
                }`}
              >
                {verification1Complete && verification2Complete ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <UserCheck className="w-5 h-5 text-[#0B0C10]" />
                )}
              </div>
              <h3 className="text-white font-bold">Verify You're Human</h3>
            </div>
            <p className="text-[#888888] text-sm mb-4">Complete 2 quick verifications to confirm you're not a bot.</p>

            {!canDownload && step === 1 && (
              <div className="space-y-3">
                <div className="p-3 bg-[#0B0C10] rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#888888]">Verification {getCurrentVerificationNumber()} of 2</span>
                    <span className="text-[#00FFFF] font-bold">{verification1Complete ? "1" : "0"}/2 Complete</span>
                  </div>
                  {verification1Complete && (
                    <p className="text-green-400 text-xs flex items-center gap-1 mb-2">
                      <CheckCircle className="w-3 h-3" />
                      First verification passed!
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerificationClick}
                  className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify Step {getCurrentVerificationNumber()}
                </button>
              </div>
            )}

            {verification1Complete && verification2Complete && (
              <p className="text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                All Verifications Complete!
              </p>
            )}
          </motion.div>

          {/* Step 2: Wait */}
          <motion.div
            className={`p-6 rounded-2xl border transition-all ${
              step === 2
                ? "bg-[#00FFFF]/10 border-[#00FFFF]"
                : canDownload
                  ? "bg-green-500/10 border-green-500"
                  : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  canDownload ? "bg-green-500" : step === 2 ? "bg-[#00FFFF]" : "bg-[#2A2B33]"
                }`}
              >
                {canDownload ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Clock className={`w-5 h-5 ${step === 2 ? "text-[#0B0C10]" : "text-[#666666]"}`} />
                )}
              </div>
              <h3 className="text-white font-bold">Please Wait</h3>
            </div>
            <p className="text-[#888888] text-sm mb-4">Wait for verification to complete.</p>

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#2A2B33" strokeWidth="4" fill="none" />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="#00FFFF"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * (10 - countdown)) / 10}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#00FFFF]">{countdown}</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[#888888] text-sm">Verifying step {getCurrentVerificationNumber()}...</p>
              </div>
            )}

            {canDownload && (
              <p className="text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Ready to Download
              </p>
            )}

            {step < 2 && !canDownload && (
              <div className="flex items-center justify-center h-20">
                <Clock className="w-8 h-8 text-[#2A2B33]" />
              </div>
            )}
          </motion.div>

          {/* Step 3: Download */}
          <motion.div
            className={`p-6 rounded-2xl border transition-all ${
              canDownload ? "bg-green-500/10 border-green-500" : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  canDownload ? "bg-green-500" : "bg-[#2A2B33]"
                }`}
              >
                {canDownload ? (
                  <Download className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-[#666666] font-bold">3</span>
                )}
              </div>
              <h3 className="text-white font-bold">Download</h3>
            </div>
            <p className="text-[#888888] text-sm mb-4">Your download link is ready. Click to download.</p>

            {canDownload ? (
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Now
              </button>
            ) : (
              <div className="flex items-center justify-center h-12">
                <Shield className="w-8 h-8 text-[#2A2B33]" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Ad Banner Area */}
        {adSettings?.showDownloadPageAds && adSettings?.horizontalAdCode && (
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden">
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      body { margin: 0; padding: 8px; display: flex; align-items: center; justify-content: center; background: transparent; }
                    </style>
                  </head>
                  <body>${adSettings.horizontalAdCode}</body>
                  </html>
                `}
                className="w-full min-h-[90px]"
                style={{ border: "none" }}
                scrolling="no"
                title="Advertisement"
              />
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          className="p-6 bg-[#1A1B23] border border-[#2A2B33] rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00FFFF]" />
            Safe Download
          </h3>
          <ul className="space-y-2 text-[#888888] text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              All files are scanned for viruses and malware
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              High-quality video files in original resolution
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              Fast download speeds from our CDN servers
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
