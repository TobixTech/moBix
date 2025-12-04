import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import MovieCard from "@/components/movie-card"
import { getPublicMovies, getAllGenres } from "@/lib/server-actions"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading-spinner"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Browse Movies | moBix",
  description: "Browse our entire collection of movies. Find action, drama, comedy, sci-fi, and more.",
}

async function BrowseContent({ genre }: { genre?: string }) {
  const [movies, genres] = await Promise.all([getPublicMovies(), getAllGenres()])

  const filteredMovies = genre ? movies.filter((m) => m.genre?.toLowerCase() === genre.toLowerCase()) : movies

  return (
    <>
      {/* Genre Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/browse"
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            !genre ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-[#1A1B23] text-white hover:bg-[#2A2B33]"
          }`}
        >
          All
        </Link>
        {genres.map((g) => (
          <Link
            key={g}
            href={`/browse?genre=${encodeURIComponent(g)}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              genre?.toLowerCase() === g.toLowerCase()
                ? "bg-[#00FFFF] text-[#0B0C10]"
                : "bg-[#1A1B23] text-white hover:bg-[#2A2B33]"
            }`}
          >
            {g}
          </Link>
        ))}
      </div>

      <AdBanner type="horizontal" placement="homepage" className="mb-8" />

      {/* Movies Grid */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#888888] text-lg">No movies found{genre ? ` in ${genre}` : ""}.</p>
        </div>
      )}

      <AdBanner type="horizontal" placement="homepage" className="mt-8" />
    </>
  )
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Movies</h1>
        <p className="text-[#888888] mb-6">Explore our entire collection</p>

        <Suspense fallback={<LoadingSpinner size="lg" message="Loading movies..." />}>
          <BrowseContent genre={params.genre} />
        </Suspense>
      </div>

      <Footer />
    </main>
  )
}
