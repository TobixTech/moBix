import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import ErrorMessage from "@/components/error-message"
import { getMoviesByGenre, getFeaturedMovie, getTrendingMovies } from "@/lib/server-actions"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading-spinner"

async function HomepageContent() {
  try {
    const [featuredMovie, trendingMovies, actionMovies, dramaMovies, sciFiMovies, comedyMovies, nollywoodMovies] =
      await Promise.all([
        getFeaturedMovie(),
        getTrendingMovies(),
        getMoviesByGenre("Action"),
        getMoviesByGenre("Drama"),
        getMoviesByGenre("Sci-Fi"),
        getMoviesByGenre("Comedy"),
        getMoviesByGenre("Nollywood"),
      ])

    console.log("[v0] Movies fetched for /home:", {
      trending: trendingMovies.length,
      action: actionMovies.length,
      drama: dramaMovies.length,
      scifi: sciFiMovies.length,
      comedy: comedyMovies.length,
      nollywood: nollywoodMovies.length,
    })

    return (
      <>
        <HeroBanner movie={featuredMovie} />

        <div className="px-4 md:px-8 py-8 space-y-12">
          {trendingMovies.length > 0 && (
            <div>
              <MovieCarousel title="Trending Now" movies={trendingMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {actionMovies.length > 0 && (
            <div>
              <MovieCarousel title="Action & Adventure" movies={actionMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {dramaMovies.length > 0 && (
            <div>
              <MovieCarousel title="Drama" movies={dramaMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {sciFiMovies.length > 0 && (
            <div>
              <MovieCarousel title="Sci-Fi" movies={sciFiMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {comedyMovies.length > 0 && (
            <div>
              <MovieCarousel title="Comedy" movies={comedyMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {nollywoodMovies.length > 0 && (
            <div>
              <MovieCarousel title="Nollywood" movies={nollywoodMovies} />
              <AdBanner type="horizontal" placement="homepage" className="my-8" />
            </div>
          )}

          {trendingMovies.length === 0 &&
            actionMovies.length === 0 &&
            dramaMovies.length === 0 &&
            sciFiMovies.length === 0 &&
            comedyMovies.length === 0 &&
            nollywoodMovies.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/60 text-lg">No movies available yet. Check back soon!</p>
              </div>
            )}
        </div>
      </>
    )
  } catch (error) {
    console.error("[v0] Error loading /home content:", error)
    return (
      <div className="px-4 md:px-8 py-24">
        <ErrorMessage
          title="Failed to Load Content"
          message="We couldn't load the movies. Please refresh the page or try again later."
        />
      </div>
    )
  }
}

export default async function AuthenticatedHomePage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={false} />

      <Suspense fallback={<LoadingSpinner size="lg" message="Loading movies..." />}>
        <HomepageContent />
      </Suspense>

      <Footer />
    </main>
  )
}
