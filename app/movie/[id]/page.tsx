import { notFound } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getMovieById, getRelatedMovies, getAdSettings } from "@/lib/server-actions"
import MovieDetailClient from "@/components/movie-detail-client"

export const dynamic = "force-dynamic"

export default async function MovieDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const movieId = resolvedParams.id

  console.log("[v0] Loading movie detail page for ID:", movieId)

  const [movie, adSettings] = await Promise.all([getMovieById(movieId), getAdSettings()])

  if (!movie) {
    console.log("[v0] Movie not found, showing 404 for ID:", movieId)
    notFound()
  }

  console.log("[v0] Movie loaded successfully:", movie.title)
  console.log("[v0] Ad settings loaded, VAST URL:", adSettings?.vastUrl || "Not configured")
  console.log("[v0] Smart Link URL:", adSettings?.smartLinkUrl || "Not configured")

  const relatedMovies = await getRelatedMovies(movie.id, movie.genre || "Action")

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        <MovieDetailClient
          movie={movie}
          relatedMovies={relatedMovies}
          vastUrl={adSettings?.vastUrl} // Updated from vastPrerollUrl to vastUrl
          smartLinkUrl={adSettings?.smartLinkUrl} // Added Smart Link URL prop
          adBannerVertical={<AdBanner type="vertical" placement="movieDetail" className="mb-6" />}
          adBannerHorizontal={<AdBanner type="horizontal" placement="movieDetail" className="mb-12" />}
        />
      </div>

      <Footer />
    </main>
  )
}
