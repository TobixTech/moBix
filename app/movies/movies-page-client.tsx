"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Film, Loader2 } from "lucide-react"
import MovieCard from "@/components/movie-card"
import AdBanner from "@/components/ad-banner"
import { Button } from "@/components/ui/button"

interface Movie {
  id: string
  title: string
  posterUrl: string
  genre: string
}

interface MoviesPageClientProps {
  genres: string[]
}

export default function MoviesPageClient({ genres }: MoviesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialGenre = searchParams.get("genre") || ""

  const [selectedGenre, setSelectedGenre] = useState(initialGenre)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 24

  const fetchMovies = useCallback(
    async (reset = false) => {
      try {
        const currentOffset = reset ? 0 : offset
        if (reset) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
          random: "true",
        })

        if (selectedGenre) {
          params.set("genre", selectedGenre)
        }

        const response = await fetch(`/api/movies?${params}`)
        const data = await response.json()

        if (reset) {
          setMovies(data.movies)
        } else {
          setMovies((prev) => [...prev, ...data.movies])
        }

        setHasMore(data.hasMore)
        setOffset(currentOffset + data.movies.length)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [selectedGenre, offset],
  )

  useEffect(() => {
    setOffset(0)
    fetchMovies(true)
  }, [selectedGenre])

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre)
    const params = new URLSearchParams()
    if (genre) {
      params.set("genre", genre)
    }
    router.push(`/movies${params.toString() ? `?${params}` : ""}`, { scroll: false })
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMovies(false)
    }
  }

  return (
    <div className="py-8">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-white mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {selectedGenre ? `${selectedGenre} Movies` : "All Movies"}
      </motion.h1>

      {/* Genre Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          onClick={() => handleGenreChange("")}
          variant={selectedGenre === "" ? "default" : "outline"}
          className={
            selectedGenre === ""
              ? "bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
              : "border-white/20 text-white hover:bg-white/10 bg-transparent"
          }
          size="sm"
        >
          All
        </Button>
        {genres.map((genre) => (
          <Button
            key={genre}
            onClick={() => handleGenreChange(genre)}
            variant={selectedGenre === genre ? "default" : "outline"}
            className={
              selectedGenre === genre
                ? "bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
                : "border-white/20 text-white hover:bg-white/10 bg-transparent"
            }
            size="sm"
          >
            {genre}
          </Button>
        ))}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="w-16 h-16 text-white/20 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Movies Found</h2>
          <p className="text-white/60">
            {selectedGenre ? `No movies found in the "${selectedGenre}" genre.` : "No movies available at the moment."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie, index) => (
              <motion.div
                key={`${movie.id}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: (index % limit) * 0.02 }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </div>

          {/* Ad Banner after movies */}
          <AdBanner type="horizontal" placement="homepage" className="my-8" />

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold px-8"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Movies"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
