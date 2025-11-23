import { HeroBannerSkeleton, MovieCarouselSkeleton } from "@/components/skeleton-loader"
import Navbar from "@/components/navbar"

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={false} />
      <HeroBannerSkeleton />

      <div className="px-4 md:px-8 py-8 space-y-12">
        <MovieCarouselSkeleton />
        <MovieCarouselSkeleton />
        <MovieCarouselSkeleton />
        <MovieCarouselSkeleton />
      </div>
    </main>
  )
}
