"use client"

import type React from "react"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import ReportContentModal from "@/components/report-content-modal"
import {
  Play,
  Plus,
  Check,
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  Film,
  Clock,
  Heart,
  Bookmark,
  Send,
  Eye,
} from "lucide-react"
import SeriesVideoPlayer from "@/components/series-video-player"
import SocialShare from "@/components/social-share"
import {
  addToSeriesWatchlist,
  removeFromSeriesWatchlist,
  toggleSeriesLike,
  addSeriesComment,
  addSeriesToWatchLater,
  rateSeriesAction,
} from "@/lib/series-actions"

interface Episode {
  id: string
  seasonId: string
  episodeNumber: number
  title: string
  description: string | null
  duration: number | null
  thumbnailUrl: string | null
  videoUrl: string
  downloadEnabled?: boolean
  downloadUrl?: string | null
  createdAt: Date
}

interface Season {
  id: string
  seriesId: string
  seasonNumber: number
  title: string | null
  description: string | null
  releaseYear: number | null
  totalEpisodes: number
  episodes: Episode[]
}

interface Comment {
  id: string
  text: string
  rating: number | null
  createdAt: Date
  user: {
    email: string
    firstName: string | null
    displayName: string
  }
}

interface Series {
  id: string
  slug: string | null
  title: string
  description: string
  posterUrl: string
  bannerUrl: string | null
  genre: string
  releaseYear: number
  status: string
  totalSeasons: number
  totalEpisodes: number
  averageRating: string | null
  views: number
  seasons: Season[]
  comments: Comment[]
  likesCount: number
}

interface SeriesDetailClientProps {
  series: Series
  adBannerHorizontal: React.ReactNode
  adBannerVertical: React.ReactNode
  initialInWatchlist: boolean
  initialIsLiked: boolean
  prerollAdCodes: { name: string; code: string }[]
  midrollAdCodes: { name: string; code: string }[]
  midrollEnabled: boolean
  midrollIntervalMinutes: number
}

const statusColors: Record<string, string> = {
  ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  upcoming: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}

export default function SeriesDetailClient({
  series,
  adBannerHorizontal,
  adBannerVertical,
  initialInWatchlist,
  initialIsLiked,
  prerollAdCodes,
  midrollAdCodes,
  midrollEnabled,
  midrollIntervalMinutes,
}: SeriesDetailClientProps) {
  const { isSignedIn } = useUser()
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(series.likesCount || 0)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(series.seasons[0] || null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set([series.seasons[0]?.id]))
  const [userRating, setUserRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isWatchLaterLoading, setIsWatchLaterLoading] = useState(false)
  const [inWatchLater, setInWatchLater] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentRating, setCommentRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState<Comment[]>(series.comments || [])

  const rating =
    typeof series.averageRating === "string" ? Number.parseFloat(series.averageRating) : series.averageRating || 0

  const handleWatchlistToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to add to watchlist")
      return
    }
    setIsLoading(true)
    try {
      if (inWatchlist) {
        await removeFromSeriesWatchlist(series.id)
        setInWatchlist(false)
        toast.success("Removed from watchlist")
      } else {
        await addToSeriesWatchlist(series.id)
        setInWatchlist(true)
        toast.success("Added to watchlist")
      }
    } catch {
      toast.error("Failed to update watchlist")
    }
    setIsLoading(false)
  }

  const handleLike = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to like")
      return
    }
    setIsLiking(true)
    try {
      const result = await toggleSeriesLike(series.id)
      if (result.success) {
        setIsLiked(result.liked || false)
        if (typeof result.likesCount === "number") {
          setLikesCount(result.likesCount)
        }
        toast.success(result.liked ? "Liked!" : "Unliked")
      } else {
        toast.error(result.error || "Failed to like")
      }
    } catch {
      toast.error("Failed to like")
    }
    setIsLiking(false)
  }

  const handleWatchLater = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save for later")
      return
    }
    setIsWatchLaterLoading(true)
    try {
      const result = await addSeriesToWatchLater(series.id)
      if (result.success) {
        setInWatchLater(true)
        toast.success("Added to Continue Watching")
      } else {
        toast.error(result.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save for later")
    }
    setIsWatchLaterLoading(false)
  }

  const handleAddComment = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to comment")
      return
    }
    if (!commentText.trim()) {
      toast.error("Please enter a comment")
      return
    }
    setIsSubmitting(true)
    try {
      const result = await addSeriesComment(series.id, commentText, commentRating)
      if (result.success && result.comment) {
        setComments([result.comment as Comment, ...comments])
        setCommentText("")
        setCommentRating(5)
        toast.success("Comment added!")
      } else {
        toast.error(result.error || "Failed to add comment")
      }
    } catch {
      toast.error("Failed to add comment")
    }
    setIsSubmitting(false)
  }

  const toggleSeasonExpand = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons)
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId)
    } else {
      newExpanded.add(seasonId)
    }
    setExpandedSeasons(newExpanded)
  }

  const playEpisode = (episode: Episode) => {
    setCurrentEpisode(episode)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRatingSubmit = async (star: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate")
      return
    }
    setUserRating(star)
    try {
      const result = await rateSeriesAction(series.id, star)
      if (result.success) {
        toast.success("Rating submitted!")
      } else {
        toast.error(result.error || "Failed to submit rating")
      }
    } catch {
      toast.error("Failed to submit rating")
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0C10]">
      {/* Hero Section */}
      <div className="relative">
        {/* Background */}
        <div
          className="absolute inset-0 h-[70vh] bg-cover bg-center"
          style={{ backgroundImage: `url(${series.bannerUrl || series.posterUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Video Player or Poster */}
            <div className="lg:w-2/3">
              {currentEpisode ? (
                <div className="space-y-4">
                  <SeriesVideoPlayer
                    videoUrl={currentEpisode.videoUrl}
                    posterUrl={currentEpisode.thumbnailUrl || series.posterUrl}
                    title={series.title}
                    episodeTitle={`S${selectedSeason?.seasonNumber} E${currentEpisode.episodeNumber}: ${currentEpisode.title}`}
                  />

                  <div className="bg-[#1A1B23]/80 backdrop-blur-sm rounded-xl p-4 border border-[#2A2B33]">
                    <h3 className="text-xl font-bold text-white">{currentEpisode.title}</h3>
                    <p className="text-[#888888] text-sm mt-1">
                      Season {selectedSeason?.seasonNumber} · Episode {currentEpisode.episodeNumber}
                      {currentEpisode.duration && ` · ${currentEpisode.duration} min`}
                    </p>
                    {currentEpisode.description && (
                      <p className="text-gray-300 mt-2 text-sm">{currentEpisode.description}</p>
                    )}
                  </div>

                  {currentEpisode.downloadEnabled && currentEpisode.downloadUrl && (
                    <a
                      href={currentEpisode.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold rounded-xl transition-all w-fit"
                    >
                      <Film className="w-5 h-5" />
                      Download Episode
                    </a>
                  )}
                </div>
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#2A2B33] shadow-2xl group">
                  <img
                    src={series.bannerUrl || series.posterUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {series.seasons[0]?.episodes[0] && (
                      <button
                        onClick={() => playEpisode(series.seasons[0].episodes[0])}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#00FFFF] flex items-center justify-center shadow-lg shadow-[#00FFFF]/30 hover:scale-110 transition-transform duration-300"
                      >
                        <Play className="w-10 h-10 md:w-12 md:h-12 text-black fill-black ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ad Banner Below Player */}
              <div className="mt-6">{adBannerHorizontal}</div>
            </div>

            {/* Series Info */}
            <div className="lg:w-1/3 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[series.status] || statusColors.ongoing}`}
                  >
                    {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                  </span>
                  <span className="text-[#888888] text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {series.views.toLocaleString()} views
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{series.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#888888]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {series.releaseYear}
                  </span>
                  <span className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    {series.totalSeasons} Season{series.totalSeasons > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {series.totalEpisodes} Episodes
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">{rating.toFixed(1)}</span>
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed">{series.description}</p>

              {/* Genre */}
              <div className="flex flex-wrap gap-2">
                {series.genre.split(",").map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-[#1A1B23] text-[#00FFFF] rounded-full text-sm border border-[#00FFFF]/20"
                  >
                    {g.trim()}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleWatchlistToggle}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    inWatchlist
                      ? "bg-[#00FFFF] text-black"
                      : "bg-[#1A1B23] text-white border border-[#2A2B33] hover:border-[#00FFFF]"
                  }`}
                >
                  {isLoading ? (
                    <Film className="w-5 h-5 animate-spin" />
                  ) : inWatchlist ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </button>

                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    isLiked
                      ? "bg-red-500 text-white"
                      : "bg-[#1A1B23] text-white border border-[#2A2B33] hover:border-red-500"
                  }`}
                >
                  {isLiking ? (
                    <Film className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
                  )}
                  {likesCount}
                </button>

                <button
                  onClick={handleWatchLater}
                  disabled={isWatchLaterLoading || inWatchLater}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    inWatchLater
                      ? "bg-purple-500 text-white"
                      : "bg-[#1A1B23] text-white border border-[#2A2B33] hover:border-purple-500"
                  }`}
                >
                  {isWatchLaterLoading ? (
                    <Film className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className={`w-5 h-5 ${inWatchLater ? "fill-white" : ""}`} />
                  )}
                  {inWatchLater ? "Saved" : "Watch Later"}
                </button>

                <ReportContentModal seriesId={series.id} contentTitle={series.title} contentType="series" />
              </div>

              {/* Social Share */}
              <SocialShare
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={series.title}
                description={series.description}
              />

              {/* Rate This Series */}
              <div className="bg-[#1A1B23]/80 backdrop-blur-sm rounded-xl p-4 border border-[#2A2B33]">
                <h4 className="text-white font-semibold mb-3">Rate This Series</h4>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingSubmit(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Ad */}
              <div className="hidden lg:block">{adBannerVertical}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasons & Episodes */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Seasons & Episodes</h2>
        <div className="space-y-4">
          {series.seasons.map((season) => (
            <div key={season.id} className="bg-[#1A1B23] rounded-xl border border-[#2A2B33] overflow-hidden">
              <button
                onClick={() => toggleSeasonExpand(season.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#2A2B33]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[#00FFFF] font-bold">Season {season.seasonNumber}</span>
                  {season.title && <span className="text-gray-400">· {season.title}</span>}
                  <span className="text-gray-500 text-sm">{season.episodes.length} Episodes</span>
                </div>
                {expandedSeasons.has(season.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {expandedSeasons.has(season.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#2A2B33]">
                      {season.episodes.map((episode) => (
                        <div
                          key={episode.id}
                          onClick={() => playEpisode(episode)}
                          className={`flex items-center gap-4 p-4 hover:bg-[#2A2B33]/50 cursor-pointer transition-colors border-b border-[#2A2B33] last:border-b-0 ${
                            currentEpisode?.id === episode.id ? "bg-[#00FFFF]/10 border-l-4 border-l-[#00FFFF]" : ""
                          }`}
                        >
                          <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#2A2B33]">
                            {episode.thumbnailUrl ? (
                              <img
                                src={episode.thumbnailUrl || "/placeholder.svg"}
                                alt={episode.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              E{episode.episodeNumber}: {episode.title}
                            </p>
                            {episode.description && (
                              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{episode.description}</p>
                            )}
                            {episode.duration && (
                              <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {episode.duration} min
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Comments</h2>

        {/* Add Comment */}
        {isSignedIn && (
          <div className="bg-[#1A1B23] rounded-xl p-6 border border-[#2A2B33] mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              className="w-full bg-[#0B0C10] text-white rounded-lg p-4 border border-[#2A2B33] focus:border-[#00FFFF] focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setCommentRating(star)}>
                    <Star
                      className={`w-5 h-5 ${
                        star <= commentRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddComment}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#00FFFF] text-black font-semibold rounded-lg hover:bg-[#00FFFF]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Film className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Post Comment
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-[#1A1B23] rounded-xl p-6 border border-[#2A2B33]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFFF] to-cyan-600 flex items-center justify-center text-black font-bold">
                      {comment.user.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-white font-medium">{comment.user.displayName}</p>
                      <p className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {comment.rating && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= comment.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-gray-300">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
