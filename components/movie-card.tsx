"use client"

import Link from "next/link"
import { Heart, Play } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import StarRating from "./star-rating"

interface MovieCardProps {
  movie: {
    id: string
    slug?: string
    title: string
    posterUrl?: string
    genre?: string
    year?: number
    averageRating?: number | string | null
  }
  progress?: number
}

export default function MovieCard({ movie, progress }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTouched, setIsTouched] = useState(false)

  const movieUrl = movie.slug ? `/movie/${movie.slug}` : `/movie/${movie.id}`
  const rating =
    typeof movie.averageRating === "string" ? Number.parseFloat(movie.averageRating) : movie.averageRating || 0

  const handleTouchStart = () => {
    setIsTouched(true)
  }

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouched(false), 150)
  }

  const showOverlay = isHovered || isTouched

  return (
    <Link href={movieUrl} prefetch={false}>
      <motion.div
        className="flex-shrink-0 w-full aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] animate-pulse" />
        )}
        <motion.img
          src={movie.posterUrl || `/placeholder.svg?height=288&width=192&query=movie poster ${movie.title}`}
          alt={movie.title}
          className="w-full h-full object-cover"
          animate={{ scale: showOverlay ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />

        {rating > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1 py-0.5 rounded flex items-center gap-0.5">
            <StarRating rating={rating} size="xs" maxRating={1} />
            <span className="text-white/90 text-[10px] font-medium">{rating.toFixed(1)}</span>
          </div>
        )}

        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div className="h-full bg-[#00FFFF]" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 md:p-3">
          <h3 className="text-white font-medium text-xs md:text-sm line-clamp-2">{movie.title}</h3>
          {(movie.genre || movie.year) && (
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/60 mt-0.5">
              {movie.year && <span>{movie.year}</span>}
              {movie.genre && movie.year && <span>•</span>}
              {movie.genre && <span className="truncate">{movie.genre.split(",")[0]}</span>}
            </div>
          )}
        </div>

        <motion.div
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: showOverlay ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ pointerEvents: showOverlay ? "auto" : "none" }}
        >
          <motion.div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#00FFFF] flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: showOverlay ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Play className="w-5 h-5 md:w-6 md:h-6 text-[#0B0C10] ml-1" fill="#0B0C10" />
          </motion.div>

          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsLiked(!isLiked)
            }}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition hidden md:flex"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-[#00FFFF] text-[#00FFFF]" : "text-white"}`} />
          </motion.button>
        </motion.div>
      </motion.div>
    </Link>
  )
}
