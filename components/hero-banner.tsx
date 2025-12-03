"use client"

import { Play, Info } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"

interface Movie {
  id: string
  slug?: string
  title: string
  description: string
  posterUrl: string
}

interface HeroBannerProps {
  movie: Movie | null
}

export default function HeroBanner({ movie }: HeroBannerProps) {
  const [isLoading, setIsLoading] = useState(true)

  const displayMovie = movie || {
    id: "",
    title: "Welcome to moBix",
    description: "Discover thousands of movies and shows. Stream your favorites anytime, anywhere.",
    posterUrl: "/cinematic-hero-banner.jpg",
  }

  const movieUrl = movie ? `/movie/${movie.slug || movie.id}` : ""

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] mt-16 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] animate-pulse" />
      )}

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#1A1B23] to-[#0B0C10]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img
          src={displayMovie.posterUrl || "/placeholder.svg"}
          alt={displayMovie.title}
          className="w-full h-full object-cover opacity-40"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
        />
      </motion.div>

      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-transparent to-[#0B0C10]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Animated Accent Light */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-[#00FFFF] rounded-full mix-blend-screen filter blur-3xl opacity-5"
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col justify-center px-4 md:px-12 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl">
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold text-white mb-4">
            {displayMovie.title}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-[#CCCCCC] mb-8 line-clamp-3">
            {displayMovie.description}
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-4">
            {movie && (
              <Link href={movieUrl}>
                <motion.button
                  className="flex items-center gap-2 px-8 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  Watch Now
                </motion.button>
              </Link>
            )}
            {movie && (
              <Link href={movieUrl}>
                <motion.button
                  className="flex items-center gap-2 px-8 py-3 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition"
                  whileHover={{ scale: 1.05, borderColor: "#00FFFF" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Info className="w-5 h-5" />
                  More Info
                </motion.button>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
