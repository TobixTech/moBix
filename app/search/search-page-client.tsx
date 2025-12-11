"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Loader2, X, Tv, Clock } from "lucide-react"
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

interface SearchHistoryItem {
  query: string
  timestamp: number
}

const SEARCH_HISTORY_KEY = "mobix_search_history"
const MAX_HISTORY_ITEMS = 10

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
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored))
      } catch {
        setSearchHistory([])
      }
    }
  }, [])

  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== searchQuery.toLowerCase())
      const newHistory = [{ query: searchQuery, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  }, [])

  const removeFromHistory = useCallback((queryToRemove: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item.query !== queryToRemove)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const performSearch = useCallback(
    async (searchQuery: string) => {
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
        if ((results.movies?.length || 0) > 0 || (results.series?.length || 0) > 0) {
          saveToHistory(searchQuery)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    },
    [saveToHistory],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setShowHistory(false)
    router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
  }

  const clearSearch = () => {
    setQuery("")
    setMovieResults([])
    setSeriesResults([])
    router.push("/search", { scroll: false })
  }

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    setShowHistory(false)
    router.push(`/search?q=${encodeURIComponent(historyQuery)}`, { scroll: false })
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
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
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

          {showHistory && searchHistory.length > 0 && !query && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1B23] border border-[#2A2B33] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#2A2B33]">
                <span className="text-white/60 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-white/40 hover:text-red-400 text-xs transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchHistory.map((item) => (
                  <div
                    key={item.timestamp}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => handleHistoryClick(item.query)}
                      className="flex items-center gap-3 text-white/80 flex-1 text-left"
                    >
                      <Search className="w-4 h-4 text-white/40" />
                      <span>{item.query}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.query)
                      }}
                      className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
