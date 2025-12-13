"use client"

import { Suspense } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBannerClient from "@/components/ad-banner-client"
import SeriesCard from "@/components/series-card"
import Link from "next/link"
import { Tv } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

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
  createdAt?: Date
  views?: number
}

interface SeriesClientProps {
  allSeries: Series[]
  genres: string[]
}

function SeriesContent({ allSeries, genres }: SeriesClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const selectedGenre = searchParams.get("genre") || ""
  const sortBy = searchParams.get("sort") || "newest"

  // Filter by genre
  let filteredSeries = selectedGenre
    ? allSeries.filter((s) => s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()))
    : allSeries

  // Sort
  switch (sortBy) {
    case "oldest":
      filteredSeries = [...filteredSeries].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      )
      break
    case "rating":
      filteredSeries = [...filteredSeries].sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0))
      break
    case "views":
      filteredSeries = [...filteredSeries].sort((a, b) => (b.views || 0) - (a.views || 0))
      break
    case "a-z":
      filteredSeries = [...filteredSeries].sort((a, b) => a.title.localeCompare(b.title))
      break
    case "z-a":
      filteredSeries = [...filteredSeries].sort((a, b) => b.title.localeCompare(a.title))
      break
    default:
      filteredSeries = [...filteredSeries].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      )
  }

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", newSort)
    router.push(`/series?${params.toString()}`)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-500/20 rounded-xl">
          <Tv className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">TV Series</h1>
          <p className="text-white/60">Browse all available series</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Genre Filter */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/series"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedGenre
                ? "bg-cyan-500 text-black"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}
          >
            All
          </Link>
          {genres.map((genre) => (
            <Link
              key={genre}
              href={`/series?genre=${genre}${sortBy !== "newest" ? `&sort=${sortBy}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedGenre === genre
                  ? "bg-cyan-500 text-black"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
            >
              {genre}
            </Link>
          ))}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="ml-auto px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Top Rated</option>
          <option value="views">Most Viewed</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
        </select>
      </div>

      {/* Horizontal Ad Banner after filters, before grid */}
      <AdBannerClient type="horizontal" placement="homepage" className="mb-8" />

      {/* Series Grid */}
      {filteredSeries.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredSeries.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>

          {/* Horizontal Ad Banner after grid */}
          <AdBannerClient type="horizontal" placement="homepage" className="mt-8" />
        </>
      ) : (
        <div className="text-center py-20">
          <Tv className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No series found</h2>
          <p className="text-white/60">
            {selectedGenre ? `No series found in ${selectedGenre} genre` : "No series available yet"}
          </p>
        </div>
      )}
    </>
  )
}

export default function SeriesClient({ allSeries, genres }: SeriesClientProps) {
  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <SeriesContent allSeries={allSeries} genres={genres} />
        </Suspense>
      </div>

      <Footer />
    </main>
  )
}
