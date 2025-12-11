"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, Tv } from "lucide-react"
import Link from "next/link"
import SeriesCard from "./series-card"

interface Series {
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

interface SeriesCarouselProps {
  title: string
  series: Series[]
  showSeeMore?: boolean
  showAds?: boolean
}

export default function SeriesCarousel({ title, series, showSeeMore = true }: SeriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (series.length === 0) return null

  return (
    <div className="relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 md:w-6 md:h-6 text-[#00FFFF]" />
          {title}
        </h2>
        {showSeeMore && (
          <Link
            href="/series"
            className="text-[#00FFFF] hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-black/80 hover:bg-[#00FFFF]/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-[#00FFFF]/50"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 scroll-smooth">
          {series.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
              <SeriesCard series={item} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-black/80 hover:bg-[#00FFFF]/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-[#00FFFF]/50"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  )
}
