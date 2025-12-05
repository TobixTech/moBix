import SeriesClient from "./series-client"
import { getAllSeries, getSeriesGenres } from "@/lib/series-actions"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "TV Series - MoBix",
  description: "Browse all TV series on MoBix",
}

export default async function SeriesPage() {
  const [allSeries, genres] = await Promise.all([getAllSeries(), getSeriesGenres()])

  return <SeriesClient allSeries={allSeries} genres={genres} />
}
