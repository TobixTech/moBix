"use client"

import Link from "next/link"
import { Heart, Play } from 'lucide-react'
import { useState } from "react"
import { motion } from "framer-motion"

interface MovieCardProps {
  movie: {
    id: string
    title: string
    posterUrl?: string
    genre?: string
    year?: number
  }
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  console.log("[v0] Movie card rendered for:", movie.title, "ID:", movie.id)

  return (
    <Link href={`/movie/${movie.id}`}>
      <motion.div
        className="flex-shrink-0 w-48 h-72 rounded overflow-hidden cursor-pointer group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] animate-pulse" />
        )}
        <motion.img
          src={movie.posterUrl || `/placeholder.svg?height=288&width=192&query=movie poster ${movie.title}`}
          alt={movie.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />

        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Content on Hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 flex flex-col justify-between p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="flex justify-end"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.button
                onClick={(e) => {
                  e.preventDefault()
                  setIsLiked(!isLiked)
                }}
                className="p-2 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 rounded-full transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#00FFFF]"}`} />
              </motion.button>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-white font-bold text-sm line-clamp-2">{movie.title}</h3>
              {(movie.genre || movie.year) && (
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                  {movie.genre && <span>{movie.genre}</span>}
                  {movie.genre && movie.year && <span>•</span>}
                  {movie.year && <span>{movie.year}</span>}
                </div>
              )}
              <motion.button
                className="w-full flex items-center justify-center gap-2 bg-[#00FFFF] text-[#0B0C10] py-2 rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-4 h-4" />
                Play
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </Link>
  )
}
