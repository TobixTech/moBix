import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import { getRecommendedMovies, getTopRatedMovies, getTrendingMovies, getPublicMovies } from "@/lib/server-actions"

export default async function AuthenticatedHomePage() {
  const [recommended, topRated, trending, recent] = await Promise.all([
    getRecommendedMovies(),
    getTopRatedMovies(),
    getTrendingMovies(),
    getPublicMovies(),
  ])

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={false} />
      <HeroBanner movie={trending[0] || recent[0] || null} />

      <div className="px-4 md:px-8 py-8 space-y-12">
        <div>
          <MovieCarousel title="Recommended For You" movies={recommended} />
          <AdBanner type="horizontal" className="my-8" />
        </div>

        <div>
          <MovieCarousel title="Trending Now" movies={trending} />
        </div>

        <div>
          <MovieCarousel title="Top Rated" movies={topRated} />
          <AdBanner type="horizontal" className="my-8" />
        </div>

        <div>
          <MovieCarousel title="Recently Added" movies={recent} />
        </div>
      </div>

      <Footer />
    </main>
  )
}
