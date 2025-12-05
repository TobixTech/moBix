"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Loader2, X } from "lucide-react"
import MovieCard from "@/components/movie-card"
import { searchMovies } from "@/lib/server-actions"

interface Movie {
  id: string
  title: string
  posterUrl: string
  year: number
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
  const [results, setResults] = useState<Movie[]>(initialResults)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const searchResults = await searchMovies(query)
        setResults(searchResults)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Update URL for sharing/bookmarking
    router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    router.push("/search", { scroll: false })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Search Movies</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full px-6 py-4 pl-14 pr-24 bg-[#1A1B23] border border-[#2A2B33] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all text-lg"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#00FFFF] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {/* Results count */}
      {query && (
        <p className="text-[#888888] mb-6">
          {isSearching ? (
            "Searching..."
          ) : (
            <>
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </>
          )}
        </p>
      )}

      {/* Results grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : query && !isSearching ? (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-12 text-center">
          <Film className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No movies found</h3>
          <p className="text-[#888888]">Try searching with different keywords</p>
        </div>
      ) : !query ? (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-12 text-center">
          <Search className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Search for movies</h3>
          <p className="text-[#888888]">Enter a movie title to get started</p>
        </div>
      ) : null}
    </div>
  )
}
