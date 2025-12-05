import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getMovieById, getRelatedMovies, getAdSettings, getWatchlistStatus } from "@/lib/server-actions"
import MovieDetailClient from "@/components/movie-detail-client"
import { MovieStructuredData, VideoStructuredData, BreadcrumbStructuredData } from "@/components/seo-structured-data"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const movie = await getMovieById(resolvedParams.id)

  if (!movie) {
    return {
      title: "Movie Not Found",
      description: "The requested movie could not be found.",
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"
  const moviePath = movie.slug || movie.id

  return {
    title: `Watch ${movie.title} (${movie.year}) Online Free - moBix`,
    description:
      movie.description ||
      `Watch ${movie.title} (${movie.year}) full movie online free on moBix. Stream ${movie.genre || "movies"} in HD quality.`,
    keywords: [
      movie.title,
      `${movie.title} full movie`,
      `watch ${movie.title} online`,
      `${movie.title} free`,
      movie.genre || "movies",
      "stream free",
      "HD movies",
    ],
    alternates: {
      canonical: `/movie/${moviePath}`,
    },
    openGraph: {
      title: `${movie.title} (${movie.year}) - Watch Free on moBix`,
      description: movie.description || `Watch ${movie.title} full movie online free on moBix`,
      images: [
        {
          url: movie.posterUrl || "/generic-movie-poster.png",
          width: 1200,
          height: 630,
          alt: movie.title,
        },
      ],
      type: "video.movie",
      siteName: "moBix",
      url: `/movie/${moviePath}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${movie.title} (${movie.year}) - moBix`,
      description: movie.description || `Watch ${movie.title} full movie online free on moBix`,
      images: [movie.posterUrl || "/generic-movie-poster.png"],
    },
  }
}

export default async function MovieDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const idOrSlug = resolvedParams.id

  const [movie, adSettings, isInWatchlist] = await Promise.all([
    getMovieById(idOrSlug),
    getAdSettings(),
    getWatchlistStatus(idOrSlug),
  ])

  if (!movie) {
    notFound()
  }

  const adTimeout = adSettings?.adTimeoutSeconds || 20
  const skipDelay = adSettings?.skipDelaySeconds || 10
  const rotationInterval = adSettings?.rotationIntervalSeconds || 5
  const showPrerollAds = adSettings?.showPrerollAds ?? true

  const midrollEnabled = adSettings?.midrollEnabled ?? false
  const midrollIntervalMinutes = adSettings?.midrollIntervalMinutes || 20

  let prerollAdCodes: { code: string; name?: string }[] = []
  try {
    if (adSettings?.prerollAdCodes) {
      prerollAdCodes = JSON.parse(adSettings.prerollAdCodes)
    }
  } catch (e) {
    console.error("Error parsing preroll ad codes:", e)
  }

  let midrollAdCodes: { code: string; name?: string }[] = []
  try {
    if (adSettings?.midrollAdCodes) {
      midrollAdCodes = JSON.parse(adSettings.midrollAdCodes)
    }
  } catch (e) {
    console.error("Error parsing midroll ad codes:", e)
  }

  const relatedMovies = await getRelatedMovies(movie.id, movie.genre || "Action")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobixtv.online"
  const moviePath = movie.slug || movie.id
  const breadcrumbs = [
    { name: "Home", url: baseUrl },
    { name: "Movies", url: `${baseUrl}/browse` },
    { name: movie.title, url: `${baseUrl}/movie/${moviePath}` },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <MovieStructuredData movie={movie} />
      <VideoStructuredData movie={movie} />
      <BreadcrumbStructuredData items={breadcrumbs} />

      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        <MovieDetailClient
          movie={movie}
          relatedMovies={relatedMovies}
          prerollAdCodes={prerollAdCodes}
          midrollAdCodes={midrollAdCodes}
          midrollEnabled={midrollEnabled}
          midrollIntervalMinutes={midrollIntervalMinutes}
          smartLinkUrl={adSettings?.smartLinkUrl}
          adTimeout={adTimeout}
          skipDelay={skipDelay}
          rotationInterval={rotationInterval}
          showPrerollAds={showPrerollAds}
          isInWatchlist={isInWatchlist}
          adBannerVertical={<AdBanner type="vertical" placement="movieDetail" className="mb-6" />}
          adBannerHorizontal={<AdBanner type="horizontal" placement="movieDetail" className="mb-12" />}
        />
      </div>

      <Footer />
    </main>
  )
}
