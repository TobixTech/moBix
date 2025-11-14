import { notFound } from 'next/navigation'
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import MovieCarousel from "@/components/movie-carousel"
import { Play, Download, Heart, Star } from 'lucide-react'
import { getMovieById, getRelatedMovies } from "@/lib/server-actions"

export default async function MovieDetail({ params }: { params: { id: string } }) {
  const movie = await getMovieById(params.id)
  
  if (!movie) {
    notFound()
  }

  const relatedMovies = await getRelatedMovies(movie.id, movie.genre)

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        {/* Video Player Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-video bg-[#1A1B23] rounded-lg overflow-hidden border border-[#2A2B33] mb-6">
              <video 
                src={movie.videoUrl} 
                poster={movie.posterUrl}
                controls
                className="w-full h-full"
              />
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
                <button className="flex items-center gap-2 px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition">
                  <Play className="w-4 h-4" />
                  Watch Now
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition">
                  <Heart className="w-4 h-4" />
                  Like ({movie.likesCount})
                </button>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-white font-bold mb-2">Description</h3>
                <p className="text-[#CCCCCC] leading-relaxed">
                  {movie.description}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h3>

              {/* Comments List */}
              <div className="space-y-4">
                {movie.comments.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  movie.comments.map((comment) => (
                    <div key={comment.id} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-bold">{comment.user.email}</h4>
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Sidebar Ad */}
            <AdBanner type="vertical" className="mb-6" />

            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 mb-6">
              <h4 className="text-white font-bold mb-4">Movie Stats</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Views</span>
                  <span className="text-white font-bold">{movie.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Rating</span>
                  <span className="text-white font-bold">{movie.avgRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Likes</span>
                  <span className="text-white font-bold">{movie.likesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Ad */}
        <AdBanner type="horizontal" className="mb-12" />

        {relatedMovies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Related Movies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedMovies.map((relMovie) => (
                <a key={relMovie.id} href={`/movie/${relMovie.id}`} className="group">
                  <img src={relMovie.posterUrl || "/placeholder.svg"} alt={relMovie.title} className="w-full rounded-lg" />
                  <h3 className="text-white mt-2 group-hover:text-[#00FFFF] transition">{relMovie.title}</h3>
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
