import { Suspense } from "react"
import SeriesClient from "./series-client"
import { getAllSeries, getSeriesGenres } from "@/lib/series-actions"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "TV Series - MoBix",
  description: "Browse all TV series on MoBix",
}

export default async function SeriesPage() {
  let allSeries: any[] = []
  let genres: string[] = []

  try {
    const [seriesData, genresData] = await Promise.all([getAllSeries(), getSeriesGenres()])
    allSeries = seriesData
    genres = genresData
  } catch (error) {
    console.error("Error fetching series data:", error)
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SeriesClient allSeries={allSeries} genres={genres} />
    </Suspense>
  )
}
