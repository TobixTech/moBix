import { MovieCarouselSkeleton } from "@/components/skeleton-loader"
import Navbar from "@/components/navbar"

export default function WatchlistLoading() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 px-4 md:px-8">
        <div className="h-12 w-48 bg-gradient-to-r from-[#1A1B23] via-[#2A2B33] to-[#1A1B23] rounded animate-pulse mb-8" />
        <MovieCarouselSkeleton />
      </div>
    </main>
  )
}
