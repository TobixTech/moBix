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
