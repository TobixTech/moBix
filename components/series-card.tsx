"use client"

import Link from "next/link"
import { Play, Tv } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import StarRating from "./star-rating"

interface SeriesCardProps {
  series: {
    id: string
    slug?: string | null
    title: string
    posterUrl?: string
    genre?: string
    releaseYear?: number
    averageRating?: number | string | null
    totalSeasons?: number
    totalEpisodes?: number
    status?: string
  }
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTouched, setIsTouched] = useState(false)

  const seriesUrl = `/series/${series.slug || series.id}`
  const rating =
    typeof series.averageRating === "string" ? Number.parseFloat(series.averageRating) : series.averageRating || 0

  const handleTouchStart = () => {
    setIsTouched(true)
  }

  const handleTouchEnd = () => {
    setTimeout(() => setIsTouched(false), 150)
  }

  const showOverlay = isHovered || isTouched

  return (
    <Link href={seriesUrl} prefetch={false}>
      <motion.div
        className="flex-shrink-0 w-full aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group relative shadow-lg"
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
          src={series.posterUrl || `/placeholder.svg?height=288&width=192&query=tv series poster ${series.title}`}
          alt={series.title}
          className="w-full h-full object-cover"
          animate={{ scale: showOverlay ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />

        {/* TV Badge */}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-cyan-400 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
          <Tv className="w-3 h-3 text-black" />
          <span className="text-[10px] font-bold text-black">TV</span>
        </div>

        {rating > 0 && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            <StarRating rating={rating} size="sm" showValue />
          </div>
        )}

        {/* Always visible bottom info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 md:p-3">
          <h3 className="text-white font-medium text-xs md:text-sm line-clamp-2">{series.title}</h3>
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/60 mt-0.5">
            {series.releaseYear && <span>{series.releaseYear}</span>}
            {series.totalSeasons !== undefined && series.totalSeasons > 0 && (
              <>
                <span>•</span>
                <span>S{series.totalSeasons}</span>
              </>
            )}
            {series.genre && (
              <>
                <span>•</span>
                <span className="truncate">{series.genre.split(",")[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* Hover/Touch Overlay with Play Button */}
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
        </motion.div>
      </motion.div>
    </Link>
  )
}
