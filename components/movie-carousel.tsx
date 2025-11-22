"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import MovieCard from "./movie-card"
import NativeAdCard from "./native-ad-card" // Import NativeAdCard component
import { getPublicMovies } from "@/lib/server-actions"

interface Movie {
  id: string
  title: string
  posterUrl: string
  genre: string
}

interface MovieCarouselProps {
  title: string
  movies?: Movie[]
}

export default function MovieCarousel({ title, movies: initialMovies }: MovieCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [movies, setMovies] = useState<Movie[]>(initialMovies || [])
  const [loading, setLoading] = useState(!initialMovies)
  const [adCode, setAdCode] = useState<string>("")

  useEffect(() => {
    if (!initialMovies) {
      const fetchMovies = async () => {
        try {
          const data = await getPublicMovies()
          setMovies(data)
        } catch (error) {
          console.error("Error fetching movies:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchMovies()
    }

    const fetchAdCode = async () => {
      try {
        const response = await fetch("/api/ad-settings")
        const data = await response.json()
        if (data.horizontalAdCode) {
          setAdCode(data.horizontalAdCode)
        }
      } catch (error) {
        console.error("Error fetching ad code:", error)
      }
    }

    fetchAdCode()
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
          className="text-2xl font-bold text-white"
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

  const moviesWithAds: (Movie | { isAd: true; id: string })[] = []
  movies.forEach((movie, index) => {
    moviesWithAds.push(movie)
    if ((index + 1) % 2 === 0 && adCode) {
      moviesWithAds.push({ isAd: true, id: `ad-${index}` })
    }
  })

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.h2
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>

      <div className="relative group">
        {/* Left Arrow */}
        <motion.button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6 text-[#00FFFF]" />
        </motion.button>

        {/* Carousel */}
        <div
          id={`carousel-${title}`}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {moviesWithAds.map((item, index) => (
            <motion.div
              key={"isAd" in item ? item.id : item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              {"isAd" in item ? <NativeAdCard adCode={adCode} /> : <MovieCard movie={item} />}
            </motion.div>
          ))}
        </div>

        {/* Right Arrow */}
        <motion.button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6 text-[#00FFFF]" />
        </motion.button>
      </div>
    </motion.div>
  )
}
