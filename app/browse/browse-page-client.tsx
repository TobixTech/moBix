"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, SortAsc, X, ChevronDown } from "lucide-react"
import MovieCard from "@/components/movie-card"
import AdBannerClient from "@/components/ad-banner-client"

interface Movie {
  id: string
  slug: string | null
  title: string
  posterUrl: string
  genre: string
  year: number
  views: number
  averageRating: string | null
  createdAt: Date
}

interface BrowsePageClientProps {
  movies: Movie[]
  genres: string[]
  initialGenre?: string
}

type SortOption = "newest" | "oldest" | "rating" | "views" | "a-z" | "z-a"

export default function BrowsePageClient({ movies, genres, initialGenre }: BrowsePageClientProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : [])
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rating", label: "Top Rated" },
    { value: "views", label: "Most Viewed" },
    { value: "a-z", label: "A-Z" },
    { value: "z-a", label: "Z-A" },
  ]

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSortBy("newest")
  }

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies]

    if (selectedGenres.length > 0) {
      result = result.filter((movie) =>
        selectedGenres.some((genre) => movie.genre?.toLowerCase() === genre.toLowerCase()),
      )
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "rating":
        result.sort((a, b) => Number.parseFloat(b.averageRating || "0") - Number.parseFloat(a.averageRating || "0"))
        break
      case "views":
        result.sort((a, b) => b.views - a.views)
        break
      case "a-z":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "z-a":
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    return result
  }, [movies, selectedGenres, sortBy])

  const moviesWithAds = useMemo(() => {
    const items: Array<{ type: "movie" | "ad"; movie?: Movie; index: number }> = []
    filteredAndSortedMovies.forEach((movie, index) => {
      items.push({ type: "movie", movie, index })
      // Add ad after every 12 movies
      if ((index + 1) % 12 === 0 && index < filteredAndSortedMovies.length - 1) {
        items.push({ type: "ad", index: index + 0.5 })
      }
    })
    return items
  }, [filteredAndSortedMovies])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter Toggle Button (Mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1B23] rounded-xl text-white border border-[#2A2B33]"
        >
          <Filter className="w-4 h-4" />
          <span>Filter by Genre</span>
          {selectedGenres.length > 0 && (
            <span className="bg-[#00FFFF] text-[#0B0C10] text-xs px-2 py-0.5 rounded-full font-medium">
              {selectedGenres.length}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-3 bg-[#1A1B23] rounded-xl text-white hover:bg-[#2A2B33] transition border border-[#2A2B33]"
          >
            <SortAsc className="w-4 h-4 text-[#00FFFF]" />
            <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 sm:right-auto mt-2 w-full sm:w-48 bg-[#1A1B23] rounded-xl shadow-xl border border-[#2A2B33] z-50 overflow-hidden"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#2A2B33] transition ${
                      sortBy === option.value ? "text-[#00FFFF] bg-[#2A2B33]" : "text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear Filters - only show when filters are active */}
        {(selectedGenres.length > 0 || sortBy !== "newest") && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-3 text-[#00FFFF] hover:bg-[#00FFFF]/10 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {(showFilters || typeof window !== "undefined") && (
          <motion.div
            className={`flex-wrap gap-2 ${showFilters ? "flex" : "hidden sm:flex"}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <button
              onClick={() => setSelectedGenres([])}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedGenres.length === 0
                  ? "bg-[#00FFFF] text-[#0B0C10]"
                  : "bg-[#1A1B23] text-white hover:bg-[#2A2B33] border border-[#2A2B33]"
              }`}
            >
              All
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedGenres.includes(genre)
                    ? "bg-[#00FFFF] text-[#0B0C10]"
                    : "bg-[#1A1B23] text-white hover:bg-[#2A2B33] border border-[#2A2B33]"
                }`}
              >
                {genre}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Genre Tags */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGenres.map((genre) => (
            <span
              key={genre}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00FFFF]/10 text-[#00FFFF] rounded-full text-sm border border-[#00FFFF]/30"
            >
              {genre}
              <button onClick={() => toggleGenre(genre)} className="hover:text-white transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <AdBannerClient type="horizontal" placement="homepage" />

      {moviesWithAds.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {moviesWithAds.map((item, index) => (
            <motion.div
              key={item.type === "movie" ? item.movie!.id : `ad-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
              className={item.type === "ad" ? "col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6" : ""}
            >
              {item.type === "movie" ? (
                <MovieCard movie={item.movie!} />
              ) : (
                <AdBannerClient type="horizontal" placement="homepage" />
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1B23] flex items-center justify-center">
            <Filter className="w-8 h-8 text-[#888888]" />
          </div>
          <p className="text-[#888888] text-lg mb-2">No movies found</p>
          {selectedGenres.length > 0 && (
            <>
              <p className="text-[#666666] text-sm mb-4">Try adjusting your filters</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded-full font-medium hover:bg-[#00CCCC] transition"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}

      <AdBannerClient type="horizontal" placement="homepage" />
    </div>
  )
}
