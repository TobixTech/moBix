import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import AuthModalWrapper from "@/components/auth-modal-wrapper"
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

    return (
      <>
        <HeroBanner movie={featuredMovie} />

        <div className="px-4 md:px-8 py-8 space-y-12">
          <div>
            <MovieCarousel title="Trending Now" movies={trendingMovies} />
            <AdBanner type="horizontal" placement="homepage" className="my-8" />
          </div>

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
        </div>
      </>
    )
  } catch (error) {
    console.error("[v0] Error loading homepage content:", error)
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

export default async function PublicHomePage() {
  return (
    <AuthModalWrapper>
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar showAuthButtons={true} />

        <Suspense fallback={<LoadingSpinner size="lg" message="Loading movies..." />}>
          <HomepageContent />
        </Suspense>

        <Footer />
      </main>
    </AuthModalWrapper>
  )
}
