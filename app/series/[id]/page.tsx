import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getSeriesWithSeasons, isSeriesInWatchlist, hasUserLikedSeries } from "@/lib/series-actions"
import { getAdSettings, checkUserPremiumStatus } from "@/lib/server-actions"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
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

  const { userId } = await auth()
  let isPremiumUser = false

  if (userId) {
    const premiumStatus = await checkUserPremiumStatus(userId)
    isPremiumUser = premiumStatus.isPremium
  }

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

  let prerollAdCodes: { name: string; code: string }[] = []
  let midrollAdCodes: { name: string; code: string }[] = []

  if (!isPremiumUser) {
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
  }

  const showPrerollAds = isPremiumUser ? false : (adSettings?.showPrerollAds ?? true) && prerollAdCodes.length > 0

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <SeriesDetailClient
        series={series}
        initialInWatchlist={inWatchlist}
        initialIsLiked={isLiked}
        prerollAdCodes={prerollAdCodes}
        midrollAdCodes={midrollAdCodes}
        midrollEnabled={isPremiumUser ? false : (adSettings?.midrollEnabled ?? false)}
        midrollIntervalMinutes={adSettings?.midrollIntervalMinutes ?? 20}
        isPremiumUser={isPremiumUser}
        showPrerollAds={showPrerollAds}
        adBannerHorizontal={isPremiumUser ? null : <AdBanner type="horizontal" placement="movie-detail" />}
        adBannerVertical={isPremiumUser ? null : <AdBanner type="vertical" placement="movie-detail" />}
      />

      <Footer />
    </main>
  )
}
