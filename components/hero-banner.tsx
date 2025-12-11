"use client"

import { Play, Info, ChevronLeft, ChevronRight, Film, Tv } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

interface ContentItem {
  id: string
  slug?: string
  title: string
  description: string
  posterUrl: string
  type: "movie" | "series"
  genre?: string
  year?: number | string
  rating?: number
}

interface HeroBannerProps {
  movies?: ContentItem[]
  series?: ContentItem[]
}

const ROTATION_INTERVAL = 12000 // 12 seconds per slide

export default function HeroBanner({ movies = [], series = [] }: HeroBannerProps) {
  const allContent: ContentItem[] = [
    ...movies.slice(0, 5).map((m) => ({ ...m, type: "movie" as const })),
    ...series.slice(0, 5).map((s) => ({ ...s, type: "series" as const })),
  ]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentContent = allContent[currentIndex] || {
    id: "",
    title: "Welcome to moBix",
    description: "Discover thousands of movies and shows. Stream your favorites anytime, anywhere.",
    posterUrl: "/cinematic-hero-banner.jpg",
    type: "movie" as const,
  }

  const contentUrl =
    currentContent.type === "series"
      ? `/series/${currentContent.slug || currentContent.id}`
      : `/movie/${currentContent.slug || currentContent.id}`

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (allContent.length <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allContent.length)
      setProgressKey((prev) => prev + 1)
    }, ROTATION_INTERVAL)
  }, [allContent.length])

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, startTimer])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allContent.length) % allContent.length)
    setProgressKey((prev) => prev + 1)
    startTimer()
  }, [allContent.length, startTimer])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allContent.length)
    setProgressKey((prev) => prev + 1)
    startTimer()
  }, [allContent.length, startTimer])

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      setProgressKey((prev) => prev + 1)
      startTimer()
    },
    [startTimer],
  )

  return (
    <div
      className="relative w-full h-[550px] md:h-[650px] lg:h-[700px] mt-16 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#1A1B23] to-[#0B0C10] animate-pulse" />
          )}
          <img
            src={currentContent.posterUrl || "/placeholder.svg?height=700&width=1400&query=cinematic movie poster"}
            alt={currentContent.title}
            className="w-full h-full object-cover"
            loading="eager"
            onLoad={() => setIsLoading(false)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-[#0B0C10]/30" />

      {/* Animated Accent Glow */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00FFFF] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.07]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Content Type Badge */}
              <motion.div
                className="flex items-center gap-2 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded-full text-[#00FFFF] text-xs font-medium backdrop-blur-sm">
                  {currentContent.type === "series" ? (
                    <>
                      <Tv className="w-3 h-3" />
                      TV Series
                    </>
                  ) : (
                    <>
                      <Film className="w-3 h-3" />
                      Movie
                    </>
                  )}
                </span>
                {currentContent.genre && (
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-xs backdrop-blur-sm">
                    {currentContent.genre}
                  </span>
                )}
                {currentContent.year && (
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-xs backdrop-blur-sm">
                    {currentContent.year}
                  </span>
                )}
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {currentContent.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-base md:text-lg lg:text-xl text-white/70 mb-8 line-clamp-3 max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {currentContent.description}
              </motion.p>

              {/* Buttons */}
              <motion.div
                className="flex flex-wrap gap-3 md:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {currentContent.id && (
                  <>
                    <Link href={contentUrl}>
                      <motion.button
                        className="group flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-[#00FFFF] text-[#0B0C10] font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>Watch Now</span>
                      </motion.button>
                    </Link>
                    <Link href={contentUrl}>
                      <motion.button
                        className="group flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/10 text-white font-semibold rounded-lg border border-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-[#00FFFF]/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Info className="w-5 h-5" />
                        <span>More Info</span>
                      </motion.button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {allContent.length > 1 && (
        <>
          <motion.button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/30 border border-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white hover:border-[#00FFFF]/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
          <motion.button
            onClick={goToNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/30 border border-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white hover:border-[#00FFFF]/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        </>
      )}

      {/* Slide Indicators & Thumbnails */}
      {allContent.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {allContent.map((item, index) => (
            <motion.button
              key={item.id || index}
              onClick={() => goToSlide(index)}
              className={`relative overflow-hidden rounded-md transition-all duration-300 ${
                index === currentIndex
                  ? "w-16 md:w-20 h-10 md:h-12 ring-2 ring-[#00FFFF] ring-offset-2 ring-offset-[#0B0C10]"
                  : "w-10 md:w-12 h-10 md:h-12 opacity-50 hover:opacity-80"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={item.posterUrl || "/placeholder.svg?height=48&width=80&query=movie thumbnail"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {index === currentIndex && !isPaused && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#00FFFF]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: ROTATION_INTERVAL / 1000, ease: "linear" }}
                  key={`progress-${progressKey}`}
                />
              )}
              {/* Show static full bar when paused */}
              {index === currentIndex && isPaused && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-[#00FFFF]/50 w-full" />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Current Slide Number */}
      {allContent.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 right-6 md:right-12 flex items-center gap-2 text-white/50 text-sm font-medium">
          <span className="text-[#00FFFF] text-lg font-bold">{String(currentIndex + 1).padStart(2, "0")}</span>
          <span>/</span>
          <span>{String(allContent.length).padStart(2, "0")}</span>
        </div>
      )}
    </div>
  )
}
