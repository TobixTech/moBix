import { Suspense } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { searchMovies, getAdSettings } from "@/lib/server-actions"
import SearchPageClient from "./search-page-client"

export const dynamic = "force-dynamic"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ""

  const [results, adSettings] = await Promise.all([query ? searchMovies(query) : Promise.resolve([]), getAdSettings()])

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        <AdBanner type="horizontal" placement="homepage" className="mb-6" />

        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SearchPageClient initialResults={results} initialQuery={query} />
        </Suspense>

        <AdBanner type="horizontal" placement="homepage" className="mt-8" />
      </div>

      <Footer />
    </main>
  )
}
