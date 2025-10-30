"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getMovieById,
  getRelatedMovies,
  getLikeCount,
  isMovieLiked,
  getMovieComments,
  getAverageRating,
  toggleLike,
  postComment,
} from "@/lib/server-actions"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AdBanner from "@/components/ad-banner"
import { Play, Download, Heart, Star } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { notFound } from "next/navigation"

export default function MovieDetail({ params }: { params: { id: string } }) {
  const { userId } = useAuth()
  const [movie, setMovie] = useState<any>(null)
  const [relatedMovies, setRelatedMovies] = useState<any[]>([])
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [rating, setRating] = useState(5)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieData = await getMovieById(params.id)
        if (!movieData) {
          notFound()
        }
        setMovie(movieData)

        const [related, likes, liked, commentsData, ratingData] = await Promise.all([
          getRelatedMovies(movieData.genre, params.id, 4),
          getLikeCount(params.id),
          userId ? isMovieLiked(userId, params.id) : Promise.resolve(false),
          getMovieComments(params.id),
          getAverageRating(params.id),
        ])

        setRelatedMovies(related)
        setLikeCount(likes)
        setIsLiked(liked)
        setComments(commentsData)
        setAverageRating(ratingData)
      } catch (error) {
        console.error("Error fetching movie data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, userId])

  const handleLike = async () => {
    if (!userId) {
      alert("Please sign in to like movies")
      return
    }

    try {
      const result = await toggleLike(userId, params.id)
      setIsLiked(result.liked)
      setLikeCount((prev) => (result.liked ? prev + 1 : prev - 1))
    } catch (error) {
      console.error("Error toggling like:", error)
      alert("Failed to update like")
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      alert("Please sign in to post comments")
      return
    }

    if (!commentText.trim()) {
      alert("Please enter a comment")
      return
    }

    try {
      await postComment(userId, params.id, commentText, rating)
      setCommentText("")
      setRating(5)

      // Refresh comments and rating
      const [updatedComments, updatedRating] = await Promise.all([
        getMovieComments(params.id),
        getAverageRating(params.id),
      ])
      setComments(updatedComments)
      setAverageRating(updatedRating)
      alert("Comment posted successfully!")
    } catch (error) {
      console.error("Error posting comment:", error)
      alert("Failed to post comment")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading movie...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!movie) {
    notFound()
  }

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
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-6 py-2 rounded font-bold transition ${
                    isLiked
                      ? "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]"
                      : "bg-[#1A1B23] text-white border border-[#2A2B33] hover:border-[#00FFFF]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  Like ({likeCount})
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
              <form onSubmit={handlePostComment} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= rating ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#2A2B33]"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-[#0B0C10] border border-[#2A2B33] rounded px-4 py-2 text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] resize-none"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="mt-3 px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Post Comment
                </button>
              </form>

              {/* Average Rating Display */}
              {averageRating.count > 0 && (
                <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Average Rating</p>
                      <p className="text-3xl font-bold text-[#00FFFF]">{averageRating.average.toFixed(1)}/5</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(averageRating.average) ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#2A2B33]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-white/60 text-sm ml-auto">Based on {averageRating.count} reviews</p>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-bold">{comment.userId}</h4>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < comment.rating ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#2A2B33]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#CCCCCC]">{comment.text}</p>
                      <p className="text-white/40 text-xs mt-2">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60 text-center py-8">No comments yet. Be the first to review!</p>
                )}
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
                  <span className="text-[#888888]">Likes</span>
                  <span className="text-white font-bold">{likeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Rating</span>
                  <span className="text-white font-bold">{averageRating.average.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Reviews</span>
                  <span className="text-white font-bold">{averageRating.count}</span>
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
