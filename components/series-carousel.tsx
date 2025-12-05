"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import SeriesCard from "./series-card"

interface Series {
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

interface SeriesCarouselProps {
  title: string
  series: Series[]
  showSeeMore?: boolean
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
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        {showSeeMore && (
          <Link href="/series" className="text-[#00FFFF] hover:underline text-sm">
            See All
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {series.map((s) => (
            <div key={s.id} style={{ scrollSnapAlign: "start" }}>
              <SeriesCard series={s} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
