import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import AuthModalWrapper from "@/components/auth-modal-wrapper"
import { getMoviesByGenre, getFeaturedMovie, getTrendingMovies } from "@/lib/server-actions"

export default async function PublicHomePage() {
  const [featuredMovie, trendingMovies, actionMovies, dramaMovies, sciFiMovies, comedyMovies] = await Promise.all([
    getFeaturedMovie(),
    getTrendingMovies(),
    getMoviesByGenre("Action"),
    getMoviesByGenre("Drama"),
    getMoviesByGenre("Sci-Fi"),
    getMoviesByGenre("Comedy"),
  ])

  return (
    <AuthModalWrapper>
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar showAuthButtons={true} />
        
        <HeroBanner movie={featuredMovie} />

        <div className="px-4 md:px-8 py-8 space-y-12">
          <div>
            <MovieCarousel title="Trending Now" movies={trendingMovies} />
            <AdBanner type="horizontal" className="my-8" />
          </div>

          <div>
            <MovieCarousel title="Action & Adventure" movies={actionMovies} />
            <AdBanner type="horizontal" className="my-8" />
          </div>

          <div>
            <MovieCarousel title="Drama" movies={dramaMovies} />
          </div>

          {sciFiMovies.length > 0 && (
            <div>
              <MovieCarousel title="Sci-Fi" movies={sciFiMovies} />
            </div>
          )}

          {comedyMovies.length > 0 && (
            <div>
              <MovieCarousel title="Comedy" movies={comedyMovies} />
            </div>
          )}
        </div>

        <Footer />
      </main>
    </AuthModalWrapper>
  )
}
