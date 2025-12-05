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

    // Filter by genres
    if (selectedGenres.length > 0) {
      result = result.filter((movie) =>
        selectedGenres.some((genre) => movie.genre?.toLowerCase() === genre.toLowerCase()),
      )
    }

    // Sort
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

  return (
    <div>
      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Filter Toggle Button (Mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-[#1A1B23] rounded-lg text-white"
        >
          <Filter className="w-4 h-4" />
          Filters
          {selectedGenres.length > 0 && (
            <span className="bg-[#00FFFF] text-[#0B0C10] text-xs px-2 py-0.5 rounded-full">
              {selectedGenres.length}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23] rounded-lg text-white hover:bg-[#2A2B33] transition"
          >
            <SortAsc className="w-4 h-4" />
            {sortOptions.find((o) => o.value === sortBy)?.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-48 bg-[#1A1B23] rounded-lg shadow-xl border border-[#2A2B33] z-50 overflow-hidden"
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

        {/* Clear Filters */}
        {(selectedGenres.length > 0 || sortBy !== "newest") && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-[#00FFFF] hover:text-white transition"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}

        {/* Results Count */}
        <span className="text-[#888888] text-sm ml-auto">
          {filteredAndSortedMovies.length} movie{filteredAndSortedMovies.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Genre Filter Chips (Desktop always visible, Mobile collapsible) */}
      <motion.div
        className={`flex flex-wrap gap-2 mb-6 ${showFilters ? "block" : "hidden md:flex"}`}
        initial={false}
        animate={{ height: showFilters || window.innerWidth >= 768 ? "auto" : 0 }}
      >
        <button
          onClick={() => setSelectedGenres([])}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedGenres.length === 0 ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-[#1A1B23] text-white hover:bg-[#2A2B33]"
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
                : "bg-[#1A1B23] text-white hover:bg-[#2A2B33]"
            }`}
          >
            {genre}
          </button>
        ))}
      </motion.div>

      {/* Selected Genre Tags */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedGenres.map((genre) => (
            <span
              key={genre}
              className="flex items-center gap-1 px-3 py-1 bg-[#00FFFF]/20 text-[#00FFFF] rounded-full text-sm"
            >
              {genre}
              <button onClick={() => toggleGenre(genre)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <AdBannerClient type="horizontal" placement="homepage" className="mb-8" />

      {/* Movies Grid */}
      {filteredAndSortedMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAndSortedMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#888888] text-lg">
            No movies found{selectedGenres.length > 0 ? ` for ${selectedGenres.join(", ")}` : ""}.
          </p>
          {selectedGenres.length > 0 && (
            <button onClick={clearFilters} className="mt-4 text-[#00FFFF] hover:text-white transition">
              Clear filters
            </button>
          )}
        </div>
      )}

      <AdBannerClient type="horizontal" placement="homepage" className="mt-8" />
    </div>
  )
}
