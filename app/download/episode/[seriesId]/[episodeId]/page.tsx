import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { getAdSettings } from "@/lib/server-actions"
import { getSeriesById, getEpisodeById } from "@/lib/series-actions"
import EpisodeDownloadClient from "./episode-download-client"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: { seriesId: string; episodeId: string }
}): Promise<Metadata> {
  const series = await getSeriesById(params.seriesId)
  const episode = await getEpisodeById(params.episodeId)

  if (!series || !episode) {
    return { title: "Episode Not Found" }
  }

  return {
    title: `Download ${series.title} - ${episode.title} - moBix`,
    description: `Download ${series.title} ${episode.title} in HD quality from moBix.`,
  }
}

export default async function EpisodeDownloadPage({
  params,
}: {
  params: { seriesId: string; episodeId: string }
}) {
  const [series, episode, adSettings] = await Promise.all([
    getSeriesById(params.seriesId),
    getEpisodeById(params.episodeId),
    getAdSettings(),
  ])

  if (!series || !episode) {
    notFound()
  }

  if (!episode.downloadEnabled || !episode.downloadUrl) {
    redirect(`/series/${series.id}`)
  }

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <EpisodeDownloadClient series={series} episode={episode} adSettings={adSettings} />
      <Footer />
    </main>
  )
}
