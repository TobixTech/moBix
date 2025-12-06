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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0C10] overflow-hidden">
      {/* Background animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -100],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        {/* Film Reel Animation */}
        <motion.div
          className="relative w-32 h-32 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer Film Reel */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-cyan-500/20"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(0,255,255,0.1) 30deg, transparent 60deg, transparent 360deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          {/* Film Sprocket Holes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-[#0B0C10] border-2 border-cyan-500/50 rounded-sm"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-52px)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          ))}

          {/* Middle Ring Glow */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-cyan-400/60"
            animate={{
              boxShadow: [
                "0 0 20px rgba(0,255,255,0.3)",
                "0 0 40px rgba(0,255,255,0.5)",
                "0 0 20px rgba(0,255,255,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />

          {/* Inner Core with Pulse */}
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600"
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: [
                "0 0 30px rgba(0,255,255,0.4)",
                "0 0 60px rgba(0,255,255,0.6)",
                "0 0 30px rgba(0,255,255,0.4)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />

          {/* Play Icon in Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white fill-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <path d="M8 5v14l11-7z" />
            </motion.svg>
          </div>
        </motion.div>

        {/* Brand Name with Typewriter Effect */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1
            className="text-3xl font-black tracking-tight mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-white">moB</span>
            <motion.span
              className="text-cyan-400"
              animate={{
                textShadow: [
                  "0 0 10px rgba(0,255,255,0.5)",
                  "0 0 20px rgba(0,255,255,0.8)",
                  "0 0 10px rgba(0,255,255,0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              ix
            </motion.span>
          </motion.h1>

          {/* Loading Bar */}
          <div className="w-48 h-1 bg-[#1A1B23] rounded-full overflow-hidden mx-auto mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 rounded-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </div>

          {/* Loading Text */}
          <motion.p
            className="text-cyan-400/70 text-sm font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            Loading your entertainment...
          </motion.p>
        </motion.div>

        {/* Floating Cinema Elements */}
        <div className="absolute -z-10">
          {["🎬", "🎥", "🍿", "⭐"].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl opacity-20"
              style={{
                left: `${-80 + i * 50}px`,
                top: `${-60 + (i % 2) * 120}px`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.5,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PageLoader() {
  return <PremiumLoader />
}
