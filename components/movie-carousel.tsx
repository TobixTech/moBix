"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import MovieCard from "./movie-card"

const mockMovies = [
  { id: 1, title: "Cosmic Adventure", rating: 8.5 },
  { id: 2, title: "Silent Echo", rating: 7.8 },
  { id: 3, title: "Neon Dreams", rating: 8.2 },
  { id: 4, title: "Lost Kingdom", rating: 7.9 },
  { id: 5, title: "Time Paradox", rating: 8.7 },
  { id: 6, title: "Ocean Depths", rating: 7.6 },
]

interface MovieCarouselProps {
  title: string
}

export default function MovieCarousel({ title }: MovieCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(`carousel-${title}`)
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
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {mockMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <MovieCard movie={movie} />
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
