import { notFound } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getMovieById, getSmartRecommendations, getAdSettings } from "@/lib/server-actions"
import MovieDetailClient from "@/components/movie-detail-client"
import { generateOpenGraph, generateMovieSchema } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const movie = await getMovieById(resolvedParams.id)

  if (!movie) {
    return {
      title: "Movie Not Found | moBix",
      description: "The requested movie could not be found.",
    }
  }

  return generateOpenGraph({
    title: `${movie.title} (${movie.year}) | moBix`,
    description: movie.description,
    image: movie.posterUrl,
    url: `https://mobix.vercel.app/movie/${movie.id}`,
    type: "video.movie",
  })
}

export default async function MovieDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const movieId = resolvedParams.id

  console.log("[v0] Loading movie detail page for ID:", movieId)

  const [movie, adSettings] = await Promise.all([getMovieById(movieId), getAdSettings()])

  if (!movie) {
    console.log("[v0] Movie not found, showing 404 for ID:", movieId)
    notFound()
  }

  const relatedMovies = await getSmartRecommendations(movie.id, 10)

  const movieSchema = generateMovieSchema(movie)

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(movieSchema) }} />

      <div className="pt-20 px-4 md:px-8">
        <MovieDetailClient
          movie={movie}
          relatedMovies={relatedMovies}
          vastUrl={adSettings?.vastUrl}
          smartLinkUrl={adSettings?.smartLinkUrl}
          adBannerVertical={<AdBanner type="vertical" placement="movieDetail" className="mb-6" />}
          adBannerHorizontal={<AdBanner type="horizontal" placement="movieDetail" className="mb-12" />}
        />
      </div>

      <Footer />
    </main>
  )
}
