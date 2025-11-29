"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Shield, Clock, CheckCircle, ExternalLink, Film, Calendar, Tag } from "lucide-react"
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
  const [verificationStep, setVerificationStep] = useState(1) // 1 = first verification, 2 = second verification, 3 = countdown, 4 = ready
  const [countdown, setCountdown] = useState(0)
  const [firstVerificationClicks, setFirstVerificationClicks] = useState(0)
  const [secondVerificationClicks, setSecondVerificationClicks] = useState(0)
  const [canDownload, setCanDownload] = useState(false)

  const requiredClicks = 2 // Clicks required per verification

  const smartLinkUrl = adSettings?.smartLinkUrl || "https://www.profitablecreativegatetocontent.com/smartlink/?a=259210"

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && verificationStep === 3) {
      // Countdown finished, enable download
      setVerificationStep(4)
      setCanDownload(true)
    }
  }, [countdown, verificationStep])

  const handleFirstVerificationClick = () => {
    window.open(smartLinkUrl, "_blank")
    const newClicks = firstVerificationClicks + 1
    setFirstVerificationClicks(newClicks)

    if (newClicks >= requiredClicks) {
      setVerificationStep(2)
    }
  }

  const handleSecondVerificationClick = () => {
    window.open(smartLinkUrl, "_blank")
    const newClicks = secondVerificationClicks + 1
    setSecondVerificationClicks(newClicks)

    if (newClicks >= requiredClicks) {
      setVerificationStep(3)
      setCountdown(15) // 15 second countdown
    }
  }

  const handleDownload = () => {
    if (canDownload && movie.downloadUrl) {
      window.open(movie.downloadUrl, "_blank")
    }
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

        {/* Progress Indicator */}
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">Download Progress</span>
            <span className="text-[#00FFFF] text-sm font-bold">Step {verificationStep} of 4</span>
          </div>
          <div className="w-full bg-[#2A2B33] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(verificationStep / 4) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Download Steps - 4 Steps Now */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Step 1: First Verification */}
          <motion.div
            className={`p-5 rounded-2xl border transition-all ${
              verificationStep === 1
                ? "bg-[#00FFFF]/10 border-[#00FFFF]"
                : verificationStep > 1
                  ? "bg-green-500/10 border-green-500"
                  : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  verificationStep > 1
                    ? "bg-green-500 text-white"
                    : verificationStep === 1
                      ? "bg-[#00FFFF] text-[#0B0C10]"
                      : "bg-[#2A2B33] text-[#666666]"
                }`}
              >
                {verificationStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <h3 className="text-white font-bold text-sm">Verify #1</h3>
            </div>
            <p className="text-[#888888] text-xs mb-3">First human verification</p>
            {verificationStep === 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">Clicks</span>
                  <span className="text-[#00FFFF] font-bold">
                    {firstVerificationClicks}/{requiredClicks}
                  </span>
                </div>
                <div className="w-full bg-[#2A2B33] rounded-full h-1.5">
                  <div
                    className="bg-[#00FFFF] h-1.5 rounded-full transition-all"
                    style={{ width: `${(firstVerificationClicks / requiredClicks) * 100}%` }}
                  />
                </div>
                <button
                  onClick={handleFirstVerificationClick}
                  className="w-full py-2 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all flex items-center justify-center gap-1 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Verify
                </button>
              </div>
            )}
            {verificationStep > 1 && (
              <p className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Complete
              </p>
            )}
          </motion.div>

          {/* Step 2: Second Verification */}
          <motion.div
            className={`p-5 rounded-2xl border transition-all ${
              verificationStep === 2
                ? "bg-[#00FFFF]/10 border-[#00FFFF]"
                : verificationStep > 2
                  ? "bg-green-500/10 border-green-500"
                  : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  verificationStep > 2
                    ? "bg-green-500 text-white"
                    : verificationStep === 2
                      ? "bg-[#00FFFF] text-[#0B0C10]"
                      : "bg-[#2A2B33] text-[#666666]"
                }`}
              >
                {verificationStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>
              <h3 className="text-white font-bold text-sm">Verify #2</h3>
            </div>
            <p className="text-[#888888] text-xs mb-3">Second human verification</p>
            {verificationStep === 2 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888]">Clicks</span>
                  <span className="text-[#00FFFF] font-bold">
                    {secondVerificationClicks}/{requiredClicks}
                  </span>
                </div>
                <div className="w-full bg-[#2A2B33] rounded-full h-1.5">
                  <div
                    className="bg-[#00FFFF] h-1.5 rounded-full transition-all"
                    style={{ width: `${(secondVerificationClicks / requiredClicks) * 100}%` }}
                  />
                </div>
                <button
                  onClick={handleSecondVerificationClick}
                  className="w-full py-2 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all flex items-center justify-center gap-1 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Verify
                </button>
              </div>
            )}
            {verificationStep > 2 && (
              <p className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Complete
              </p>
            )}
            {verificationStep < 2 && (
              <div className="flex items-center justify-center h-12">
                <Shield className="w-6 h-6 text-[#2A2B33]" />
              </div>
            )}
          </motion.div>

          {/* Step 3: Wait/Countdown */}
          <motion.div
            className={`p-5 rounded-2xl border transition-all ${
              verificationStep === 3
                ? "bg-[#00FFFF]/10 border-[#00FFFF]"
                : verificationStep > 3
                  ? "bg-green-500/10 border-green-500"
                  : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  verificationStep > 3
                    ? "bg-green-500 text-white"
                    : verificationStep === 3
                      ? "bg-[#00FFFF] text-[#0B0C10]"
                      : "bg-[#2A2B33] text-[#666666]"
                }`}
              >
                {verificationStep > 3 ? <CheckCircle className="w-4 h-4" /> : "3"}
              </div>
              <h3 className="text-white font-bold text-sm">Prepare</h3>
            </div>
            <p className="text-[#888888] text-xs mb-3">Generating download link</p>
            {verificationStep === 3 && (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="#2A2B33" strokeWidth="3" fill="none" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="#00FFFF"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={150}
                      strokeDashoffset={150 - (150 * (15 - countdown)) / 15}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#00FFFF]">{countdown}</span>
                  </div>
                </div>
              </div>
            )}
            {verificationStep > 3 && (
              <p className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Ready
              </p>
            )}
            {verificationStep < 3 && (
              <div className="flex items-center justify-center h-12">
                <Clock className="w-6 h-6 text-[#2A2B33]" />
              </div>
            )}
          </motion.div>

          {/* Step 4: Download */}
          <motion.div
            className={`p-5 rounded-2xl border transition-all ${
              verificationStep === 4 ? "bg-green-500/10 border-green-500" : "bg-[#1A1B23] border-[#2A2B33]"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  verificationStep === 4 ? "bg-green-500 text-white" : "bg-[#2A2B33] text-[#666666]"
                }`}
              >
                {verificationStep === 4 ? <Download className="w-4 h-4" /> : "4"}
              </div>
              <h3 className="text-white font-bold text-sm">Download</h3>
            </div>
            <p className="text-[#888888] text-xs mb-3">Get your file</p>
            {verificationStep === 4 ? (
              <button
                onClick={handleDownload}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-1 text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            ) : (
              <div className="flex items-center justify-center h-12">
                <Download className="w-6 h-6 text-[#2A2B33]" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Ad Banner Area */}
        {adSettings?.showDownloadPageAds && adSettings?.horizontalAdCode && (
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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

        {/* Vertical Ad */}
        {adSettings?.showDownloadPageAds && adSettings?.verticalAdCode && (
          <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
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
                  <body>${adSettings.verticalAdCode}</body>
                  </html>
                `}
                className="w-full min-h-[250px]"
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
          transition={{ delay: 0.7 }}
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
