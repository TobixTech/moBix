"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import MovieCard from "./movie-card"
import NativeAdCard from "./native-ad-card"

interface Movie {
  id: string
  title: string
  posterUrl: string
  genre: string
}

interface MovieCarouselProps {
  title: string
  movies?: Movie[]
  genre?: string
  showSeeMore?: boolean
  showInlineAds?: boolean
  inlineAdCode?: string
  adInterval?: number // Show ad every N items
}

export default function MovieCarousel({
  title,
  movies: initialMovies,
  genre,
  showSeeMore = true,
  showInlineAds = false,
  inlineAdCode,
  adInterval = 4, // Default: ad every 4 movies
}: MovieCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [movies, setMovies] = useState<Movie[]>(initialMovies || [])
  const [loading, setLoading] = useState(!initialMovies)

  useEffect(() => {
    if (!initialMovies) {
      setLoading(false)
    }
  }, [initialMovies])

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(`carousel-${title}`)
    if (container) {
      const scrollAmount = 300
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount
      container.scrollLeft = newPosition
      setScrollPosition(newPosition)
    }
  }

  if (loading) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-xl md:text-2xl font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
      </motion.div>
    )
  }

  if (movies.length === 0) {
    return null
  }

  const buildCarouselItems = () => {
    const items: { type: "movie" | "ad"; data?: Movie; index: number }[] = []

    movies.forEach((movie, index) => {
      items.push({ type: "movie", data: movie, index })

      // Insert ad after every N movies (if ads enabled)
      if (showInlineAds && inlineAdCode && (index + 1) % adInterval === 0 && index < movies.length - 1) {
        items.push({ type: "ad", index: index + 0.5 })
      }
    })

    return items
  }

  const carouselItems = buildCarouselItems()

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-between">
        <motion.h2
          className="text-xl md:text-2xl font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
        {showSeeMore && genre && (
          <Link
            href={`/movies?genre=${encodeURIComponent(genre)}`}
            className="text-[#00FFFF] hover:text-[#00CCCC] text-sm font-medium transition-colors"
          >
            See More
          </Link>
        )}
      </div>

      <div className="relative group">
        <motion.button
          onClick={() => scroll("left")}
          className="absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-[#00FFFF]/20 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 border border-white/10 hover:border-[#00FFFF]/50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </motion.button>

        <div id={`carousel-${title}`} className="flex gap-3 overflow-x-auto scroll-smooth pb-4 scrollbar-hide">
          {carouselItems.map((item, idx) => (
            <motion.div
              key={item.type === "movie" ? item.data!.id : `ad-${idx}`}
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.3) }}
              viewport={{ once: true }}
            >
              {item.type === "movie" ? <MovieCard movie={item.data!} /> : <NativeAdCard adCode={inlineAdCode} />}
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={() => scroll("right")}
          className="absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-[#00FFFF]/20 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 border border-white/10 hover:border-[#00FFFF]/50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}
