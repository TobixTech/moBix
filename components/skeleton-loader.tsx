"use client"

import { motion } from "framer-motion"

export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] mt-16 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23]"
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%"],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      />
    </div>
  )
}

export function MovieCardSkeleton() {
  return (
    <motion.div
      className="flex-shrink-0 w-48 h-72 rounded overflow-hidden bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23]"
      animate={{
        backgroundPosition: ["0% 0%", "100% 0%"],
      }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />
  )
}

export function MovieCarouselSkeleton() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="h-8 w-32 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] rounded animate-pulse" />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(6)].map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  )
}

export function PremiumLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0C10]">
      <div className="relative flex flex-col items-center">
        {/* Main Logo Animation */}
        <motion.div
          className="relative w-24 h-24 mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          {/* Middle Ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-cyan-400/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          {/* Inner Ring with gradient */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />

          {/* Logo Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white">M</span>
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            moB<span className="text-cyan-400">ix</span>
          </h1>

          {/* Loading dots */}
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

export function PageLoader() {
  return <PremiumLoader />
}
