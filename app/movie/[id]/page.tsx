import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getMovieById, getRelatedMovies, getAdSettings, getWatchlistStatus } from "@/lib/server-actions"
import MovieDetailClient from "@/components/movie-detail-client"

export const dynamic = "force-dynamic"

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

  return {
    title: `${movie.title} (${movie.year}) - moBix`,
    description: movie.description || `Watch ${movie.title} on moBix`,
    openGraph: {
      title: `${movie.title} (${movie.year})`,
      description: movie.description || `Watch ${movie.title} on moBix`,
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
    },
    twitter: {
      card: "summary_large_image",
      title: `${movie.title} (${movie.year})`,
      description: movie.description || `Watch ${movie.title} on moBix`,
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
  const movieId = resolvedParams.id

  console.log("[v0] Loading movie detail page for ID:", movieId)

  const [movie, adSettings, isInWatchlist] = await Promise.all([
    getMovieById(movieId),
    getAdSettings(),
    getWatchlistStatus(movieId),
  ])

  if (!movie) {
    console.log("[v0] Movie not found, showing 404 for ID:", movieId)
    notFound()
  }

  console.log("[v0] Movie loaded successfully:", movie.title)
  console.log("[v0] Ad settings loaded, VAST URL:", adSettings?.vastUrl || "Not configured")
  console.log("[v0] Smart Link URL:", adSettings?.smartLinkUrl || "Not configured")

  const adTimeout = adSettings?.adTimeoutSeconds || 20

  const relatedMovies = await getRelatedMovies(movie.id, movie.genre || "Action")

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        <MovieDetailClient
          movie={movie}
          relatedMovies={relatedMovies}
          vastUrl={adSettings?.vastUrl}
          smartLinkUrl={adSettings?.smartLinkUrl}
          adTimeout={adTimeout}
          isInWatchlist={isInWatchlist}
          adBannerVertical={<AdBanner type="vertical" placement="movieDetail" className="mb-6" />}
          adBannerHorizontal={<AdBanner type="horizontal" placement="movieDetail" className="mb-12" />}
        />
      </div>

      <Footer />
    </main>
  )
}
