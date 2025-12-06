import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getSeriesWithSeasons, isSeriesInWatchlist, hasUserLikedSeries } from "@/lib/series-actions"
import { getAdSettings } from "@/lib/server-actions"
import { notFound } from "next/navigation"
import SeriesDetailClient from "./series-detail-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const series = await getSeriesWithSeasons(id)
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

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let series = null
  let adSettings = null
  let inWatchlist = false
  let isLiked = false

  try {
    const [seriesData, adSettingsData, watchlistData, likedData] = await Promise.all([
      getSeriesWithSeasons(id),
      getAdSettings(),
      isSeriesInWatchlist(id),
      hasUserLikedSeries(id),
    ])
    series = seriesData
    adSettings = adSettingsData
    inWatchlist = watchlistData
    isLiked = likedData
  } catch (error) {
    console.error("Error fetching series:", error)
  }

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
        isLiked={isLiked}
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
