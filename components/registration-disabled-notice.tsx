"use client"

import { motion } from "framer-motion"
import { UserX, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function RegistrationDisabledNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto text-center p-8"
    >
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
        <UserX className="w-10 h-10 text-amber-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">Registration Temporarily Closed</h2>

      <p className="text-white/60 mb-6 leading-relaxed">
        We're not accepting new registrations at the moment. Please check back later or contact support if you need
        assistance.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </Link>
    </motion.div>
  )
}
