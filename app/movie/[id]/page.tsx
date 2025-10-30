import { getMovieById, getRelatedMovies } from "@/lib/server-actions"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { Play, Download, Heart, Star } from "lucide-react"
import { notFound } from "next/navigation"

const mockComments = [
  { id: 1, author: "John Doe", rating: 5, text: "Absolutely amazing! Best movie I've seen this year." },
  { id: 2, author: "Jane Smith", rating: 4, text: "Great cinematography and compelling story." },
  { id: 3, author: "Mike Johnson", rating: 5, text: "A masterpiece! Highly recommended." },
]

export default async function MovieDetail({ params }: { params: { id: string } }) {
  const movie = await getMovieById(params.id)

  if (!movie) {
    notFound()
  }

  const relatedMovies = await getRelatedMovies(movie.genre, params.id, 4)

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        {/* Video Player Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-video bg-[#1A1B23] rounded-lg overflow-hidden border border-[#2A2B33] mb-6">
              <img
                src={movie.posterUrl || "/placeholder.svg"}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <a
                  href={movie.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 rounded-full transition"
                >
                  <Play className="w-12 h-12 text-[#00FFFF] fill-[#00FFFF]" />
                </a>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
              <div className="flex flex-wrap gap-4 text-[#888888] text-sm mb-4">
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.genre}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <a
                  href={movie.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  <Play className="w-4 h-4" />
                  Watch Now
                </a>
                <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition">
                  <Heart className="w-4 h-4" />
                  Like
                </button>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Description</h3>
                <p className="text-[#CCCCCC] leading-relaxed">{movie.description}</p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h3>

              {/* Comment Input */}
              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea
                      placeholder="Share your thoughts..."
                      className="w-full bg-[#0B0C10] border border-[#2A2B33] rounded px-4 py-2 text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <button className="mt-3 px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition">
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-bold">{comment.author}</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < comment.rating ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#2A2B33]"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#CCCCCC]">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Sidebar Ad */}
            <AdBanner type="vertical" className="mb-6" />

            {/* Movie Stats */}
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 mb-6">
              <h4 className="text-white font-bold mb-4">Movie Stats</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Views</span>
                  <span className="text-white font-bold">2.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Rating</span>
                  <span className="text-white font-bold">8.5/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Likes</span>
                  <span className="text-white font-bold">450K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Ad */}
        <AdBanner type="horizontal" className="mb-12" />

        {relatedMovies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Related Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <a
                  key={relatedMovie.id}
                  href={`/movie/${relatedMovie.id}`}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <img
                    src={relatedMovie.posterUrl || "/placeholder.svg"}
                    alt={relatedMovie.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-[#00FFFF]" />
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 text-sm font-bold">
                    {relatedMovie.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
