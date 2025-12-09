"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, Star, Send, Loader, Download, Plus, Check, Bookmark } from "lucide-react"
import {
  toggleLike,
  addComment,
  toggleWatchlist,
  rateMovie,
  getUserRating,
  addToWatchLater,
} from "@/lib/server-actions"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import ProductionVideoPlayer from "./production-video-player"
import SocialShare from "./social-share"
import StarRating from "./star-rating"
import ReportContentModal from "./report-content-modal"
import { toast } from "sonner"
import { useSiteSettings } from "@/components/site-settings-provider"

interface Comment {
  id: string
  text: string
  rating: number
  createdAt: Date
  user: {
    email: string
    firstName?: string | null
    displayName?: string
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
  downloadUrl?: string
  downloadEnabled?: boolean
}

interface RelatedMovie {
  id: string
  title: string
  posterUrl: string
  year?: number
  genre?: string
  slug?: string
}

interface PrerollAdCode {
  code: string
  name?: string
}

interface MovieDetailClientProps {
  movie: Movie
  relatedMovies: any[]
  prerollAdCodes: { code: string; name?: string }[]
  midrollAdCodes: { code: string; name?: string }[]
  midrollEnabled: boolean
  midrollIntervalMinutes: number
  smartLinkUrl?: string
  adTimeout: number
  skipDelay: number
  rotationInterval: number
  showPrerollAds: boolean
  isInWatchlist: boolean
  isPremiumUser?: boolean
  adBannerVertical?: React.ReactNode
  adBannerHorizontal?: React.ReactNode
  isLiked: boolean
  isInWatchlist: boolean
}

export default function MovieDetailClient({
  movie,
  isLiked: initialIsLiked,
  isInWatchlist: initialIsInWatchlist,
  prerollAdCodes,
  showPrerollAds,
  isPremiumUser,
}: MovieDetailClientProps) {
  const { isSignedIn, userId } = useAuth()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(movie.likesCount)
  const [isLiking, setIsLiking] = useState(false)

  const [inWatchlist, setInWatchlist] = useState(initialIsInWatchlist)
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false)

  const [isWatchLaterLoading, setIsWatchLaterLoading] = useState(false)
  const [inWatchLater, setInWatchLater] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [commentRating, setCommentRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState("")

  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState(movie.avgRating)
  const [isRating, setIsRating] = useState(false)

  const siteSettings = useSiteSettings()

  useEffect(() => {
    fetch(`/api/movies/${movie.id}/view`, { method: "POST" }).catch(() => {})

    if (isSignedIn) {
      getUserRating(movie.id).then((result) => {
        if (result.success && result.rating) {
          setUserRating(result.rating)
        }
      })
    }
  }, [movie.id, isSignedIn])

  const handleRate = async (rating: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate movies")
      return
    }

    setIsRating(true)
    const result = await rateMovie(movie.id, rating)

    if (result.success) {
      setUserRating(rating)
      if (result.averageRating) {
        setAverageRating(result.averageRating)
      }
      toast.success("Rating saved!")
    } else {
      toast.error(result.error || "Failed to rate movie")
    }

    setIsRating(false)
  }

  const handleLike = async () => {
    if (!isSignedIn || !userId) {
      toast.error("Please sign in to like movies")
      return
    }

    setIsLiking(true)
    const result = await toggleLike(movie.id)

    if (result.success) {
      setIsLiked(result.liked || false)
      setLikesCount((prev) => (result.liked ? prev + 1 : prev - 1))
    } else {
      toast.error(result.error || "Failed to like movie")
    }

    setIsLiking(false)
  }

  const handleWatchlistToggle = async () => {
    if (!isSignedIn || !userId) {
      toast.error("Please sign in to manage your watchlist")
      return
    }

    setIsWatchlistLoading(true)
    const result = await toggleWatchlist(movie.id)

    if (result.success) {
      setInWatchlist(result.added || false)
      toast.success(result.added ? "Added to watchlist" : "Removed from watchlist")
    } else {
      toast.error(result.error || "Failed to update watchlist")
    }

    setIsWatchlistLoading(false)
  }

  const handleWatchLater = async () => {
    if (!isSignedIn || !userId) {
      toast.error("Please sign in to save for later")
      return
    }

    setIsWatchLaterLoading(true)
    const result = await addToWatchLater(movie.id)

    if (result.success) {
      setInWatchLater(true)
      toast.success("Added to Continue Watching!")
    } else {
      toast.error(result.error || "Failed to save")
    }

    setIsWatchLaterLoading(false)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSignedIn || !userId) {
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
      setCommentText("")
      setCommentRating(5)
      toast.success("Comment posted!")
      window.location.reload()
    } else {
      setCommentError(result.error || "Failed to post comment")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
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
              videoUrl={movie.videoUrl || ""}
              title={movie.title}
              posterUrl={movie.posterUrl}
              movieId={movie.id}
              prerollAdCodes={prerollAdCodes}
              midrollAdCodes={[]}
              midrollEnabled={false}
              midrollIntervalMinutes={0}
              showPrerollAds={showPrerollAds}
              adTimeout={0}
              skipDelay={0}
              rotationInterval={0}
              isPremium={isPremiumUser}
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
                <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                {averageRating.toFixed(1)}/5
              </span>
            </div>

            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium mb-1">Rate this movie</h4>
                  <p className="text-white/50 text-sm">
                    {userRating ? `You rated: ${userRating}/5` : "Share your opinion"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isRating && <Loader className="w-4 h-4 animate-spin text-[#00FFFF]" />}
                  <StarRating rating={userRating || 0} size="lg" interactive={!isRating} onRate={handleRate} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {siteSettings.enableDownloads && movie.downloadEnabled && movie.downloadUrl && (
                <Link
                  href={`/download/${movie.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download
                </Link>
              )}

              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-all ${
                  inWatchlist
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-[#1A1B23] text-white border-[#2A2B33] hover:border-[#00FFFF]"
                }`}
              >
                {isWatchlistLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : inWatchlist ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                <span>{inWatchlist ? "In Watchlist" : "Watchlist"}</span>
              </button>

              <button
                onClick={handleWatchLater}
                disabled={isWatchLaterLoading || inWatchLater}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-all ${
                  inWatchLater
                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                    : "bg-[#1A1B23] text-white border-[#2A2B33] hover:border-purple-500"
                }`}
              >
                {isWatchLaterLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Bookmark className={`w-5 h-5 ${inWatchLater ? "fill-purple-400" : ""}`} />
                )}
                <span>{inWatchLater ? "Saved" : "Watch Later"}</span>
              </button>

              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-all ${
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

              <SocialShare
                title={movie.title}
                url={`/movie/${movie.id}`}
                description={movie.description}
                posterUrl={movie.posterUrl}
              />

              <ReportContentModal movieId={movie.id} movieTitle={movie.title} />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-bold text-xl mb-3">Description</h3>
              <p className="text-[#CCCCCC] leading-relaxed">{movie.description}</p>
            </div>
          </motion.div>

          {/* Reviews & Comments */}
          {siteSettings.enableComments && (
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
                        <h4 className="text-white font-bold">
                          {comment.user.displayName || comment.user.firstName || comment.user.email.split("@")[0]}
                        </h4>
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
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
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
                <span className="text-white font-bold">{averageRating.toFixed(1)}/5</span>
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
    </div>
  )
}
