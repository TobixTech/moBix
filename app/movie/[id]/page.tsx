"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import MovieCarousel from "@/components/movie-carousel"
import { Play, Download, Heart, Star } from "lucide-react"

const mockComments = [
  { id: 1, author: "John Doe", rating: 5, text: "Absolutely amazing! Best movie I've seen this year." },
  { id: 2, author: "Jane Smith", rating: 4, text: "Great cinematography and compelling story." },
  { id: 3, author: "Mike Johnson", rating: 5, text: "A masterpiece! Highly recommended." },
]

export default function MovieDetail({ params }: { params: { id: string } }) {
  const [isLiked, setIsLiked] = useState(false)
  const [comment, setComment] = useState("")

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8">
        {/* Video Player Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            {/* Player Placeholder */}
            <div className="relative w-full aspect-video bg-[#1A1B23] rounded-lg overflow-hidden border border-[#2A2B33] mb-6">
              <img src="/movie-video-player.jpg" alt="Video Player" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <button className="p-4 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 rounded-full transition">
                  <Play className="w-12 h-12 text-[#00FFFF] fill-[#00FFFF]" />
                </button>
              </div>
            </div>

            {/* Movie Info */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">The Last Horizon</h1>
              <div className="flex flex-wrap gap-4 text-[#888888] text-sm mb-4">
                <span>2024</span>
                <span>•</span>
                <span>2h 45m</span>
                <span>•</span>
                <span>Action, Sci-Fi</span>
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
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1A1B23] text-white border border-[#2A2B33] rounded hover:border-[#00FFFF] transition"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-[#00FFFF] text-[#00FFFF]" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </button>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-white font-bold mb-2">Description</h3>
                <p className="text-[#CCCCCC] leading-relaxed">
                  An epic journey across distant worlds. Experience breathtaking visuals and an unforgettable story that
                  will keep you on the edge of your seat. Follow our heroes as they navigate through cosmic challenges
                  and discover the truth about their destiny.
                </p>
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
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
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

        {/* Related Movies */}
        <MovieCarousel title="Related Movies" />
      </div>

      <Footer />
    </main>
  )
}
