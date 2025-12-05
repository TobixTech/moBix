import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getPublicMovies, getAllGenres } from "@/lib/server-actions"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading-spinner"
import BrowsePageClient from "./browse-page-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Browse Movies | moBix",
  description: "Browse our entire collection of movies. Find action, drama, comedy, sci-fi, and more.",
}

async function BrowseContent({ genre }: { genre?: string }) {
  const [movies, genres] = await Promise.all([getPublicMovies(), getAllGenres()])

  return <BrowsePageClient movies={movies} genres={genres} initialGenre={genre} />
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
