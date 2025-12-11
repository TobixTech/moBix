import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import SeriesCarousel from "@/components/series-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import ErrorMessage from "@/components/error-message"
import { getMoviesByGenre, getTrendingMovies, getAdSettings } from "@/lib/server-actions"
import { getTrendingSeries, getRecentSeries } from "@/lib/series-actions"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading-spinner"

async function HomepageContent() {
  try {
    const [
      trendingMovies,
      actionMovies,
      dramaMovies,
      sciFiMovies,
      comedyMovies,
      nollywoodMovies,
      trendingSeries,
      recentSeries,
      adSettings,
    ] = await Promise.all([
      getTrendingMovies(),
      getMoviesByGenre("Action"),
      getMoviesByGenre("Drama"),
      getMoviesByGenre("Sci-Fi"),
      getMoviesByGenre("Comedy"),
      getMoviesByGenre("Nollywood"),
      getTrendingSeries(10),
      getRecentSeries(10),
      getAdSettings(),
    ])

    const inlineAdCode = adSettings?.verticalAdCode || ""
    const showInlineAds = adSettings?.homepageEnabled && !!inlineAdCode

    const heroMovies = trendingMovies.slice(0, 5).map((m) => ({
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
      <>
        <HeroBanner movies={heroMovies} series={heroSeries} />

        <div className="px-4 md:px-8 py-8 space-y-10">
          {trendingMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Trending Now"
                movies={trendingMovies}
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          {trendingSeries.length > 0 && (
            <SeriesCarousel
              title="Popular TV Series"
              series={trendingSeries}
              showInlineAds={showInlineAds}
              inlineAdCode={inlineAdCode}
              adInterval={2}
            />
          )}

          <AdBanner type="horizontal" placement="homepage" className="my-6" />

          {actionMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Action"
                movies={actionMovies}
                genre="Action"
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          {recentSeries.length > 0 && (
            <SeriesCarousel
              title="New TV Series"
              series={recentSeries}
              showInlineAds={showInlineAds}
              inlineAdCode={inlineAdCode}
              adInterval={2}
            />
          )}

          <AdBanner type="horizontal" placement="homepage" className="my-6" />

          {dramaMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Drama"
                movies={dramaMovies}
                genre="Drama"
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          {sciFiMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Sci-Fi"
                movies={sciFiMovies}
                genre="Sci-Fi"
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          <AdBanner type="horizontal" placement="homepage" className="my-6" />

          {comedyMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Comedy"
                movies={comedyMovies}
                genre="Comedy"
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          {nollywoodMovies.length > 0 && (
            <div>
              <MovieCarousel
                title="Nollywood"
                movies={nollywoodMovies}
                genre="Nollywood"
                showInlineAds={showInlineAds}
                inlineAdCode={inlineAdCode}
                adInterval={2}
              />
            </div>
          )}

          {trendingMovies.length === 0 &&
            actionMovies.length === 0 &&
            dramaMovies.length === 0 &&
            sciFiMovies.length === 0 &&
            comedyMovies.length === 0 &&
            nollywoodMovies.length === 0 &&
            trendingSeries.length === 0 &&
            recentSeries.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/60 text-lg">No content available yet. Check back soon!</p>
              </div>
            )}
        </div>
      </>
    )
  } catch (error) {
    console.error("Error loading homepage content:", error)
    return (
      <div className="px-4 md:px-8 py-24">
        <ErrorMessage
          title="Failed to Load Content"
          message="We couldn't load the content. Please refresh the page or try again later."
        />
      </div>
    )
  }
}

export default async function PublicHomePage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <Suspense fallback={<LoadingSpinner size="lg" message="Loading content..." />}>
        <HomepageContent />
      </Suspense>

      <Footer />
    </main>
  )
}
