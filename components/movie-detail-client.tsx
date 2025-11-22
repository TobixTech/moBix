"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Heart, Star, Send, Loader, Download } from "lucide-react"
import { toggleLike, addComment } from "@/lib/server-actions"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import ProductionVideoPlayer from "./production-video-player"

interface Comment {
  id: string
  text: string
  rating: number
  createdAt: Date
  user: {
    email: string
  }
}

interface Movie {
  id: string
  title: string
  description: string
  year: number
  genre: string
  posterUrl: string
  videoUrl: string
  views: number
  likesCount: number
  avgRating: number
  comments: Comment[]
  customVastUrl?: string
  downloadUrl?: string
  downloadEnabled?: boolean
  useGlobalAd?: boolean
}

interface RelatedMovie {
  id: string
  title: string
  posterUrl: string
}

export default function MovieDetailClient({
  movie,
  relatedMovies,
  adBannerVertical,
  adBannerHorizontal,
  vastUrl,
  smartLinkUrl, // Added smartLinkUrl prop
}: {
  movie: Movie
  relatedMovies: RelatedMovie[]
  adBannerVertical?: React.ReactNode
  adBannerHorizontal?: React.ReactNode
  vastUrl?: string
  smartLinkUrl?: string // Added smartLinkUrl type
}) {
  const { userId } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(movie.likesCount)
  const [isLiking, setIsLiking] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [commentRating, setCommentRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState("")

  const [adClickCount, setAdClickCount] = useState(0)
  const [showDownloadLink, setShowDownloadLink] = useState(false)

  const isEmbedUrl = (url: string) => {
    return (
      url.includes("youtube.com/embed") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("dailymotion.com") ||
      url.includes("drive.google.com")
    )
  }

  const getEmbedUrl = (url: string) => {
    // YouTube watch URL to embed
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v")
      return `https://www.youtube.com/embed/${videoId}`
    }
    // YouTube short URL to embed
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    // Vimeo URL to embed
    if (url.includes("vimeo.com/") && !url.includes("/video/")) {
      const videoId = url.split("vimeo.com/")[1].split("?")[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const handleLike = async () => {
    if (!userId) {
      alert("Please sign in to like movies")
      return
    }

    setIsLiking(true)
    const result = await toggleLike(movie.id)

    if (result.success) {
      setIsLiked(result.liked || false)
      setLikesCount((prev) => (result.liked ? prev + 1 : prev - 1))
    } else {
      alert(result.error || "Failed to like movie")
    }

    setIsLiking(false)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      setCommentError("Please sign in to comment")
      return
    }

    if (commentText.trim().length < 10) {
      setCommentError("Comment must be at least 10 characters")
      return
    }

    setIsSubmitting(true)
    setCommentError("")

    const result = await addComment(movie.id, commentText, commentRating)

    if (result.success) {
      // Reset form
      setCommentText("")
      setCommentRating(5)
      // Refresh page to show new comment
      window.location.reload()
    } else {
      setCommentError(result.error || "Failed to post comment")
    }

    setIsSubmitting(false)
  }

  const finalVastUrl = movie.useGlobalAd !== false ? vastUrl : movie.customVastUrl

  const handleDownload = () => {
    if (!movie.downloadUrl) return

    const adUrl =
      smartLinkUrl || "https://www.profitablecreativegatetocontent.com/smartlink/?a=259210&sm=27962918&co=&mt=8"

    if (adClickCount < 2) {
      setAdClickCount((prev) => prev + 1)
      console.log(`[v0] Ad shown ${adClickCount + 1} of 2 times`)
      window.open(adUrl, "_blank")

      if (adClickCount + 1 >= 2) {
        setShowDownloadLink(true)
      }
    } else {
      window.open(movie.downloadUrl, "_blank")
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProductionVideoPlayer
              videoUrl={movie.videoUrl}
              posterUrl={movie.posterUrl}
              title={movie.title}
              vastUrl={finalVastUrl}
            />
          </motion.div>

          {/* Movie Info */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex flex-wrap gap-4 text-[#888888] text-sm mb-4">
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.genre}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#00FFFF] text-[#00FFFF]" />
                {movie.avgRating.toFixed(1)}/5
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all">
                <Play className="w-5 h-5" />
                Watch Now
              </button>
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${
                  isLiked
                    ? "bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]"
                    : "bg-[#1A1B23] text-white border-[#2A2B33] hover:border-[#00FFFF]"
                }`}
              >
                {isLiking ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-[#00FFFF]" : ""}`} />
                )}
                <span>{likesCount}</span>
              </button>

              {movie.downloadEnabled && movie.downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all"
                >
                  <Download className="w-5 h-5" />
                  {adClickCount < 2 ? `Download (Step ${adClickCount + 1}/2)` : "Download Now"}
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-bold text-xl mb-3">Description</h3>
              <p className="text-[#CCCCCC] leading-relaxed">{movie.description}</p>
            </div>
          </motion.div>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h3>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 mb-6">
              <div className="mb-4">
                <label className="block text-white font-medium mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommentRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= commentRating ? "fill-[#00FFFF] text-[#00FFFF]" : "text-[#2A2B33]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white font-medium mb-2">Your Comment</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all resize-none"
                />
              </div>

              {commentError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {commentError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {movie.comments.length === 0 ? (
                <p className="text-white/50 text-center py-8">No comments yet. Be the first to comment!</p>
              ) : (
                movie.comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 hover:border-[#00FFFF]/30 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-bold">{comment.user.email}</h4>
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
                    <p className="text-[#666666] text-xs mt-2">{new Date(comment.createdAt).toLocaleDateString()}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {adBannerVertical}

          {/* Movie Stats */}
          <motion.div
            className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 mb-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-white font-bold mb-4">Movie Stats</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888888]">Views</span>
                <span className="text-white font-bold">{movie.views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Rating</span>
                <span className="text-white font-bold">{movie.avgRating.toFixed(1)}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Likes</span>
                <span className="text-white font-bold">{likesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Comments</span>
                <span className="text-white font-bold">{movie.comments.length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {adBannerHorizontal}

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Related Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedMovies.map((relMovie) => (
              <Link key={relMovie.id} href={`/movie/${relMovie.id}`} className="group">
                <motion.div
                  className="relative aspect-[2/3] rounded-lg overflow-hidden border border-[#2A2B33]"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={relMovie.posterUrl || "/placeholder.svg?height=450&width=300"}
                    alt={relMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-bold text-sm">{relMovie.title}</h3>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  )
}
