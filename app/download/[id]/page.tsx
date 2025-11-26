import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { getMovieById, getAdSettings } from "@/lib/server-actions"
import DownloadPageClient from "./download-page-client"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const movie = await getMovieById(resolvedParams.id)

  if (!movie) {
    return { title: "Movie Not Found" }
  }

  return {
    title: `Download ${movie.title} - moBix`,
    description: `Download ${movie.title} (${movie.year}) in HD quality from moBix.`,
  }
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const [movie, adSettings] = await Promise.all([getMovieById(resolvedParams.id), getAdSettings()])

  if (!movie) {
    notFound()
  }

  if (!movie.downloadEnabled || !movie.downloadUrl) {
    redirect(`/movie/${movie.id}`)
  }

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <DownloadPageClient movie={movie} adSettings={adSettings} />
      <Footer />
    </main>
  )
}
