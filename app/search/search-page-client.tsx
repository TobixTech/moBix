"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Loader2, X, Tv } from "lucide-react"
import MovieCard from "@/components/movie-card"
import SeriesCard from "@/components/series-card"
import { searchContent } from "@/lib/server-actions"

interface Movie {
  id: string
  title: string
  posterUrl: string
  year: number
  genre: string
}

interface Series {
  id: string
  slug?: string
  title: string
  posterUrl: string
  releaseYear: number
  genre: string
}

export default function SearchPageClient({
  initialResults,
  initialQuery,
}: {
  initialResults: Movie[]
  initialQuery: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [movieResults, setMovieResults] = useState<Movie[]>(initialResults)
  const [seriesResults, setSeriesResults] = useState<Series[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "series">("all")
  const router = useRouter()

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovieResults([])
      setSeriesResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchContent(searchQuery)
      setMovieResults(results.movies || [])
      setSeriesResults(results.series || [])
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
  }

  const clearSearch = () => {
    setQuery("")
    setMovieResults([])
    setSeriesResults([])
    router.push("/search", { scroll: false })
  }

  const totalResults = movieResults.length + seriesResults.length

  return (
    <div className="pb-24 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Search</h1>

      <form onSubmit={handleSearch} className="mb-6 md:mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies & series..."
            className="w-full px-4 md:px-6 py-3 md:py-4 pl-12 md:pl-14 pr-12 md:pr-24 bg-[#1A1B23] border border-[#2A2B33] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all text-base md:text-lg"
          />
          <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 md:right-20 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#00FFFF] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {query && totalResults > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === "all" ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-[#1A1B23] text-white/70 hover:bg-[#2A2B33]"
            }`}
          >
            All ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab("movies")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "movies" ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-[#1A1B23] text-white/70 hover:bg-[#2A2B33]"
            }`}
          >
            <Film className="w-4 h-4" />
            Movies ({movieResults.length})
          </button>
          <button
            onClick={() => setActiveTab("series")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === "series" ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-[#1A1B23] text-white/70 hover:bg-[#2A2B33]"
            }`}
          >
            <Tv className="w-4 h-4" />
            Series ({seriesResults.length})
          </button>
        </div>
      )}

      {/* Results count */}
      {query && (
        <p className="text-[#888888] mb-4 md:mb-6 text-sm md:text-base">
          {isSearching ? (
            "Searching..."
          ) : (
            <>
              {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
            </>
          )}
        </p>
      )}

      {isSearching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00FFFF]" />
        </div>
      ) : totalResults > 0 ? (
        <div className="space-y-8">
          {/* Movies Section */}
          {(activeTab === "all" || activeTab === "movies") && movieResults.length > 0 && (
            <div>
              {activeTab === "all" && (
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#00FFFF]" />
                  Movies
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {movieResults.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}

          {/* Series Section */}
          {(activeTab === "all" || activeTab === "series") && seriesResults.length > 0 && (
            <div>
              {activeTab === "all" && (
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-[#00FFFF]" />
                  Series
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {seriesResults.map((s) => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : query && !isSearching ? (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 md:p-12 text-center">
          <Film className="w-12 h-12 md:w-16 md:h-16 text-[#2A2B33] mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">No results found</h3>
          <p className="text-[#888888] text-sm md:text-base">Try searching with different keywords</p>
        </div>
      ) : !query ? (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 md:p-12 text-center">
          <Search className="w-12 h-12 md:w-16 md:h-16 text-[#2A2B33] mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">Search for content</h3>
          <p className="text-[#888888] text-sm md:text-base">Enter a movie or series title to get started</p>
        </div>
      ) : null}
    </div>
  )
}
