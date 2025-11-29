import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import { getTrendingMovies, getPublicMovies, getMoviesByGenre, getAllGenres } from "@/lib/server-actions"

export default async function AuthenticatedHomePage() {
  let trending: any[] = []
  let recent: any[] = []
  let allGenres: string[] = []

  try {
    const results = await Promise.all([getTrendingMovies(), getPublicMovies(), getAllGenres()])
    trending = results[0] || []
    recent = results[1] || []
    allGenres = results[2] || []
  } catch (error) {
    console.error("Error loading home page data:", error)
  }

  // Fetch movies for each genre in parallel with error handling
  let genresWithMovies: { genre: string; movies: any[] }[] = []
  try {
    const genreMoviesPromises = allGenres.map(async (genre) => {
      try {
        const movies = await getMoviesByGenre(genre)
        return { genre, movies: movies || [] }
      } catch {
        return { genre, movies: [] }
      }
    })

    const genreMovies = await Promise.all(genreMoviesPromises)
    genresWithMovies = genreMovies.filter((g) => g.movies.length > 0)
  } catch (error) {
    console.error("Error loading genre movies:", error)
  }

  return (
    <main className="min-h-screen bg-[#0B0C10]">
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
