"use client"

import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface ContinueWatchingMovie {
  id: string
  slug: string | null
  title: string
  posterUrl: string
  genre: string
  year: number
  progress: number
  duration: number
  watchedAt: Date
}

interface ContinueWatchingCarouselProps {
  movies: ContinueWatchingMovie[]
}

export default function ContinueWatchingCarousel({ movies }: ContinueWatchingCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  if (movies.length === 0) return null

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("continue-watching-carousel")
    if (container) {
      const scrollAmount = 300
      const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount
      container.scrollLeft = newPosition
      setScrollPosition(newPosition)
    }
  }

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
          className="text-2xl font-bold text-white flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Play className="w-6 h-6 text-[#00FFFF]" />
          Continue Watching
        </motion.h2>
        <Link href="/history" className="text-[#00FFFF] hover:text-[#00CCCC] text-sm font-medium transition-colors">
          View All
        </Link>
      </div>

      <div className="relative group">
        <motion.button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6 text-[#00FFFF]" />
        </motion.button>

        <div
          id="continue-watching-carousel"
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex-shrink-0"
            >
              <Link href={`/movie/${movie.slug || movie.id}`} className="block group/card">
                <div className="relative w-[180px] h-[270px] rounded-lg overflow-hidden">
                  <Image
                    src={movie.posterUrl || "/placeholder.svg?height=270&width=180&query=movie poster"}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <div className="bg-[#00FFFF] rounded-full p-3">
                      <Play className="w-8 h-8 text-[#0B0C10] fill-current" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm mb-2 line-clamp-1">{movie.title}</p>
                    <div className="w-full h-1.5 bg-[#1A1B23] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FFFF] rounded-full transition-all"
                        style={{ width: `${movie.progress}%` }}
                      />
                    </div>
                    <p className="text-[#888888] text-xs mt-1">{movie.progress}% watched</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

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
