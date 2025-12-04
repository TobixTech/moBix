import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import { getTrendingMovies, getPublicMovies, getMoviesByGenre, getAllGenres } from "@/lib/server-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function AuthenticatedHomePage() {
  const [trending, recent, allGenres] = await Promise.all([getTrendingMovies(), getPublicMovies(), getAllGenres()])

  // Fetch movies for each genre in parallel
  const genreMoviesPromises = allGenres.map(async (genre) => ({
    genre,
    movies: await getMoviesByGenre(genre),
  }))

  const genreMovies = await Promise.all(genreMoviesPromises)

  // Filter out genres with no movies
  const genresWithMovies = genreMovies.filter((g) => g.movies.length > 0)

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar showAuthButtons={false} />
      <HeroBanner movie={trending[0] || recent[0] || null} />

      <div className="px-4 md:px-8 py-8 space-y-12">
        <AdBanner type="horizontal" placement="homepage" className="mb-4" />

        {/* Trending Section */}
        {trending.length > 0 && (
          <div>
            <MovieCarousel title="Trending Now" movies={trending} showSeeMore={false} />
          </div>
        )}

        <AdBanner type="horizontal" placement="homepage" />

        {/* Recently Added Section */}
        {recent.length > 0 && (
          <div>
            <MovieCarousel title="Recently Added" movies={recent} showSeeMore={false} />
          </div>
        )}

        {/* Genre Sections with strategic ad placement */}
        {genresWithMovies.map((genreData, index) => (
          <div key={genreData.genre}>
            <MovieCarousel
              title={genreData.genre}
              movies={genreData.movies}
              genre={genreData.genre}
              showSeeMore={true}
            />
            {(index + 1) % 2 === 0 && index < genresWithMovies.length - 1 && (
              <AdBanner type="horizontal" placement="homepage" className="mt-8" />
            )}
          </div>
        ))}

        <AdBanner type="horizontal" placement="homepage" className="mt-8" />
      </div>

      <Footer />
    </main>
  )
}
