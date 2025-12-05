"use client"

import Link from "next/link"
import { Play, Tv } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import StarRating from "./star-rating"

interface SeriesCardProps {
  series: {
    id: string
    slug?: string
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

  const seriesUrl = `/series/${series.slug || series.id}`
  const rating =
    typeof series.averageRating === "string" ? Number.parseFloat(series.averageRating) : series.averageRating || 0

  return (
    <Link href={seriesUrl} prefetch={false}>
      <motion.div
        className="flex-shrink-0 w-[140px] md:w-[180px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] animate-pulse" />
        )}
        <motion.img
          src={series.posterUrl || `/placeholder.svg?height=288&width=192&query=tv series poster ${series.title}`}
          alt={series.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />

        {/* TV Badge */}
        <div className="absolute top-2 right-2 bg-cyan-500/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          <Tv className="w-3 h-3 text-black" />
          <span className="text-xs font-bold text-black">Series</span>
        </div>

        {rating > 0 && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
            <StarRating rating={rating} size="sm" showValue />
          </div>
        )}

        {/* Status Badge */}
        {series.status && (
          <div
            className={`absolute bottom-12 left-2 px-2 py-0.5 rounded text-xs font-bold ${
              series.status === "ongoing"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : series.status === "completed"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
          </div>
        )}

        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent"
          animate={{ opacity: isHovered ? 1 : 0.6 }}
          transition={{ duration: 0.3 }}
        />

        {/* Content on Hover */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="space-y-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-white font-bold text-sm line-clamp-2">{series.title}</h3>
            <div className="flex items-center gap-2 text-xs text-[#888888]">
              {series.totalSeasons !== undefined && series.totalSeasons > 0 && (
                <span>
                  {series.totalSeasons} Season{series.totalSeasons > 1 ? "s" : ""}
                </span>
              )}
              {series.totalSeasons !== undefined && series.totalSeasons > 0 && series.releaseYear && <span>•</span>}
              {series.releaseYear && <span>{series.releaseYear}</span>}
            </div>
            {series.genre && <div className="text-xs text-cyan-400">{series.genre}</div>}
            <motion.button
              className="w-full flex items-center justify-center gap-2 bg-[#00FFFF] text-[#0B0C10] py-2 rounded font-bold text-sm hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4" />
              Watch
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Always visible title at bottom */}
        {!isHovered && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-white font-bold text-sm line-clamp-1">{series.title}</h3>
            {series.releaseYear && <span className="text-xs text-white/60">{series.releaseYear}</span>}
          </div>
        )}
      </motion.div>
    </Link>
  )
}
