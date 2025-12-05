import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getSeriesWithSeasons, isSeriesInWatchlist } from "@/lib/series-actions"
import { getAdSettings } from "@/lib/server-actions"
import { notFound } from "next/navigation"
import SeriesDetailClient from "./series-detail-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const series = await getSeriesWithSeasons(params.id)
  if (!series) return { title: "Series Not Found - MoBix" }

  return {
    title: `${series.title} - MoBix`,
    description: series.description,
    openGraph: {
      title: series.title,
      description: series.description,
      images: [series.posterUrl],
    },
  }
}

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const [series, adSettings, inWatchlist] = await Promise.all([
    getSeriesWithSeasons(params.id),
    getAdSettings(),
    isSeriesInWatchlist(params.id),
  ])

  if (!series) {
    notFound()
  }

  // Parse ad codes
  let prerollAdCodes: { name: string; code: string }[] = []
  let midrollAdCodes: { name: string; code: string }[] = []

  try {
    prerollAdCodes = JSON.parse(adSettings?.prerollAdCodes || "[]")
  } catch {
    prerollAdCodes = []
  }

  try {
    midrollAdCodes = JSON.parse(adSettings?.midrollAdCodes || "[]")
  } catch {
    midrollAdCodes = []
  }

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <SeriesDetailClient
        series={series}
        inWatchlist={inWatchlist}
        adSettings={{
          prerollEnabled: adSettings?.prerollEnabled ?? true,
          prerollAdCodes,
          midrollEnabled: adSettings?.midrollEnabled ?? false,
          midrollAdCodes,
          midrollIntervalMinutes: adSettings?.midrollIntervalMinutes ?? 20,
        }}
        adBannerHorizontal={<AdBanner type="horizontal" placement="movie-detail" />}
        adBannerVertical={<AdBanner type="vertical" placement="movie-detail" />}
      />

      <Footer />
    </main>
  )
}
