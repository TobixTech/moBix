import { notFound } from 'next/navigation'
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getMovieById, getRelatedMovies } from "@/lib/server-actions"
import MovieDetailClient from "@/components/movie-detail-client"

export const dynamic = 'force-dynamic'

export default async function MovieDetail({ params }: { params: { id: string } }) {
  console.log("[v0] Loading movie detail page for ID:", params.id)
  
  const movie = await getMovieById(params.id)
  
  if (!movie) {
    console.log("[v0] Movie not found, showing 404")
    notFound()
  }

  console.log("[v0] Movie loaded successfully:", movie.title)
  const relatedMovies = await getRelatedMovies(movie.id, movie.genre)

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        <MovieDetailClient
          movie={movie}
          relatedMovies={relatedMovies}
          adBannerVertical={<AdBanner type="vertical" placement="movieDetail" className="mb-6" />}
          adBannerHorizontal={<AdBanner type="horizontal" placement="movieDetail" className="mb-12" />}
        />
      </div>

      <Footer />
    </main>
  )
}
