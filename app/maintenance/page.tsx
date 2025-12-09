"use client"

import { motion } from "framer-motion"
import { Wrench, Clock, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

export default function MaintenancePage() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1B23] to-[#0B0C10] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated Logo */}
        <motion.div
          className="mb-8"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <Wrench className="w-12 h-12 text-black" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-black mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">moBix</span>
        </motion.h1>

        <motion.h2
          className="text-2xl md:text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Under Maintenance{dots}
        </motion.h2>

        <motion.p
          className="text-white/60 text-lg mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          We're making some improvements to give you a better experience. Please check back soon!
        </motion.p>

        {/* Status Card */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 text-cyan-400 mb-4">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Expected downtime: Brief</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-white/50 text-sm">Our team is working on it</span>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RefreshCw className="w-5 h-5" />
          Check Again
        </motion.button>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
        </div>
      </motion.div>
    </div>
  )
}
