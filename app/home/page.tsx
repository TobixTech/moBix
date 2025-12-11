import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import SeriesCarousel from "@/components/series-carousel"
import ContinueWatchingCarousel from "@/components/continue-watching-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import {
  getTrendingMovies,
  getPublicMovies,
  getMoviesByGenre,
  getAllGenres,
  getContinueWatching,
  checkUserPremiumStatus,
  getAdSettings,
} from "@/lib/server-actions"
import { getTrendingSeries, getRecentSeries } from "@/lib/series-actions"
import PromotionModalWrapper from "@/components/promotion-modal-wrapper"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function AuthenticatedHomePage() {
  const { userId } = await auth()
  let isPremiumUser = false

  if (userId) {
    const premiumStatus = await checkUserPremiumStatus(userId)
    isPremiumUser = premiumStatus.isPremium
  }

  const [trending, recent, allGenres, continueWatching, trendingSeries, recentSeries, adSettings] = await Promise.all([
    getTrendingMovies(),
    getPublicMovies(),
    getAllGenres(),
    getContinueWatching(),
    getTrendingSeries(10),
    getRecentSeries(10),
    getAdSettings(),
  ])

  // Fetch movies for each genre in parallel
  const genreMoviesPromises = allGenres.map(async (genre) => ({
    genre,
    movies: await getMoviesByGenre(genre),
  }))

  const genreMovies = await Promise.all(genreMoviesPromises)

  // Filter out genres with no movies
  const genresWithMovies = genreMovies.filter((g) => g.movies.length > 0)

  const inlineAdCode = adSettings?.verticalAdCode || ""
  const showInlineAds = !isPremiumUser && adSettings?.homepageEnabled && !!inlineAdCode

  const heroMovies = trending.slice(0, 5).map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description || "",
    posterUrl: m.posterUrl,
    genre: m.genre,
    year: m.releaseYear,
    rating: m.rating,
  }))

  const heroSeries = trendingSeries.slice(0, 5).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description || "",
    posterUrl: s.posterUrl,
    genre: s.genre,
    year: s.releaseYear,
    rating: s.rating,
  }))

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar showAuthButtons={false} />
      <HeroBanner movies={heroMovies} series={heroSeries} />

      <div className="px-4 md:px-8 py-8 space-y-12">
        {continueWatching && continueWatching.length > 0 && <ContinueWatchingCarousel movies={continueWatching} />}

        {!isPremiumUser && <AdBanner type="horizontal" placement="homepage" className="mb-4" />}

        {/* Trending Section */}
        {trending.length > 0 && (
          <div>
            <MovieCarousel
              title="Trending Now"
              movies={trending}
              showSeeMore={false}
              showInlineAds={showInlineAds}
              inlineAdCode={inlineAdCode}
              adInterval={2}
            />
          </div>
        )}

        {/* Trending Series Section */}
        {trendingSeries.length > 0 && (
          <SeriesCarousel
            title="Popular TV Series"
            series={trendingSeries}
            showInlineAds={showInlineAds}
            inlineAdCode={inlineAdCode}
            adInterval={2}
          />
        )}

        {!isPremiumUser && <AdBanner type="horizontal" placement="homepage" />}

        {/* Recently Added Section */}
        {recent.length > 0 && (
          <div>
            <MovieCarousel
              title="Recently Added"
              movies={recent}
              showSeeMore={false}
              showInlineAds={showInlineAds}
              inlineAdCode={inlineAdCode}
              adInterval={2}
            />
          </div>
        )}

        {/* New Series Section */}
        {recentSeries.length > 0 && (
          <SeriesCarousel
            title="New TV Series"
            series={recentSeries}
            showInlineAds={showInlineAds}
            inlineAdCode={inlineAdCode}
            adInterval={2}
          />
        )}

        {/* Genre Sections with strategic ad placement */}
        {genresWithMovies.map((genreData, index) => (
          <div key={genreData.genre}>
            <MovieCarousel
              title={genreData.genre}
              movies={genreData.movies}
              genre={genreData.genre}
              showSeeMore={true}
              showInlineAds={showInlineAds}
              inlineAdCode={inlineAdCode}
              adInterval={2}
            />
            {!isPremiumUser && (index + 1) % 2 === 0 && index < genresWithMovies.length - 1 && (
              <AdBanner type="horizontal" placement="homepage" className="mt-8" />
            )}
          </div>
        ))}

        {!isPremiumUser && <AdBanner type="horizontal" placement="homepage" className="mt-8" />}
      </div>

      <Footer />

      <PromotionModalWrapper />
    </main>
  )
}
