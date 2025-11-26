import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { getWatchlist } from "@/lib/server-actions"
import Link from "next/link"
import { Clock, Film } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function WatchlistPage() {
  const { success, movies, error } = await getWatchlist()

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <AdBanner type="horizontal" placement="dashboard" className="mb-6" />

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#00FFFF]/10 rounded-full">
            <Clock className="w-8 h-8 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
            <p className="text-[#888888] text-sm">Movies you've saved to watch later</p>
          </div>
        </div>

        {!success || !movies || movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#1A1B23]/50 border border-[#2A2B33] rounded-2xl">
            <div className="p-6 bg-[#00FFFF]/5 rounded-full mb-4">
              <Film className="w-12 h-12 text-[#00FFFF]/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h3>
            <p className="text-[#888888] mb-6">Start adding movies you want to watch!</p>
            <Link
              href="/home"
              className="px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie, index) => (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-[#2A2B33] bg-[#1A1B23]">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl || "/placeholder.svg"}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#888888]">No Image</div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">{movie.title}</h3>
                      <div className="flex items-center justify-between text-xs text-[#CCCCCC]">
                        <span>{movie.year}</span>
                        <span className="bg-[#00FFFF]/20 text-[#00FFFF] px-2 py-0.5 rounded">{movie.genre}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <AdBanner type="horizontal" placement="dashboard" className="mt-8" />
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}
