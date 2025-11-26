import { Suspense } from "react"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MoviesPageClient from "./movies-page-client"
import { getAllGenres } from "@/lib/server-actions"

export const metadata: Metadata = {
  title: "Browse All Movies",
  description: "Browse and discover all movies on moBix. Filter by genre and find your next favorite film.",
}

export default async function MoviesPage() {
  const genres = await getAllGenres()

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={false} />

      <div className="pt-20 px-4 md:px-8">
        <Suspense fallback={<MoviesSkeleton />}>
          <MoviesPageClient genres={genres} />
        </Suspense>
      </div>

      <Footer />
    </main>
  )
}

function MoviesSkeleton() {
  return (
    <div className="py-8">
      <div className="h-8 w-48 bg-white/10 rounded mb-6 animate-pulse" />
      <div className="flex gap-2 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
