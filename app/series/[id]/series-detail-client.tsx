"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
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
  Loader,
  Send,
  TrendingUp,
  Eye,
} from "lucide-react"
import ProductionVideoPlayer from "@/components/production-video-player"
import AdBannerClient from "@/components/ad-banner-client"
import SocialShare from "@/components/social-share"
import {
  addToSeriesWatchlist,
  removeFromSeriesWatchlist,
  toggleSeriesLike,
  addSeriesComment,
  addSeriesToWatchLater,
} from "@/lib/series-actions"
import { toast } from "sonner"

interface Episode {
  id: string
  seasonId: string
  episodeNumber: number
  title: string
  description: string | null
  duration: number | null
  thumbnailUrl: string | null
  videoUrl: string
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
  inWatchlist: boolean
  isLiked?: boolean
  adSettings: {
    prerollEnabled: boolean
    prerollAdCodes: { name: string; code: string }[]
    midrollEnabled: boolean
    midrollAdCodes: { name: string; code: string }[]
    midrollIntervalMinutes: number
  }
  adBannerHorizontal: React.ReactNode
  adBannerVertical: React.ReactNode
}

export default function SeriesDetailClient({
  series,
  inWatchlist: initialInWatchlist,
  isLiked: initialIsLiked = false,
  adSettings,
  adBannerHorizontal,
  adBannerVertical,
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

  // Comment state
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
        // Use the actual count from server instead of incrementing/decrementing
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

  const statusColors: Record<string, string> = {
    ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
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
                  <ProductionVideoPlayer
                    videoUrl={currentEpisode.videoUrl}
                    posterUrl={currentEpisode.thumbnailUrl || series.posterUrl}
                    title={`${series.title} - ${currentEpisode.title}`}
                    showPrerollAds={adSettings.prerollEnabled}
                    prerollAdCodes={adSettings.prerollAdCodes}
                    midrollEnabled={adSettings.midrollEnabled}
                    midrollAdCodes={adSettings.midrollAdCodes}
                    midrollIntervalMinutes={adSettings.midrollIntervalMinutes}
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
                    {series.totalSeasons} Seasons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {series.totalEpisodes} Episodes
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#1A1B23]/80 px-4 py-2 rounded-lg border border-[#2A2B33]">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">{rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {series.genre.split(",").map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/20"
                  >
                    {g.trim()}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed">{series.description}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {series.seasons[0]?.episodes[0] && (
                  <button
                    onClick={() => playEpisode(series.seasons[0].episodes[0])}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00FFFF] text-black font-bold hover:bg-[#00FFFF]/90 transition-all"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    Watch Now
                  </button>
                )}

                <button
                  onClick={handleWatchlistToggle}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition ${
                    inWatchlist
                      ? "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : inWatchlist ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{inWatchlist ? "In Watchlist" : "Watchlist"}</span>
                </button>

                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition ${
                    isLiked
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/10 text-white border border-white/20 hover:bg-red-500/20"
                  }`}
                >
                  {isLiking ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-red-400" : ""}`} />
                  )}
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleWatchLater}
                  disabled={isWatchLaterLoading || inWatchLater}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition ${
                    inWatchLater
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "bg-white/10 text-white border border-white/20 hover:bg-purple-500/20"
                  }`}
                >
                  {isWatchLaterLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className={`w-5 h-5 ${inWatchLater ? "fill-purple-400" : ""}`} />
                  )}
                  <span className="hidden sm:inline">{inWatchLater ? "Saved" : "Watch Later"}</span>
                </button>
              </div>

              {/* Social Share */}
              <div className="pt-2">
                <SocialShare
                  title={series.title}
                  url={`/series/${series.slug || series.id}`}
                  description={series.description}
                  posterUrl={series.posterUrl}
                />
              </div>

              {/* Side Ad Banner */}
              <div className="hidden lg:block">{adBannerVertical}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Episodes List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#00FFFF]" />
              Episodes
            </h2>

            {/* Seasons Accordion */}
            <div className="space-y-4">
              {series.seasons.map((season) => (
                <div key={season.id} className="bg-[#1A1B23] rounded-xl border border-[#2A2B33] overflow-hidden">
                  <button
                    onClick={() => toggleSeasonExpand(season.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] font-bold">
                        {season.seasonNumber}
                      </span>
                      <div className="text-left">
                        <h3 className="text-white font-semibold">
                          Season {season.seasonNumber}
                          {season.title && `: ${season.title}`}
                        </h3>
                        <p className="text-[#888888] text-sm">
                          {season.totalEpisodes || season.episodes.length} Episodes
                          {season.releaseYear && ` · ${season.releaseYear}`}
                        </p>
                      </div>
                    </div>
                    {expandedSeasons.has(season.id) ? (
                      <ChevronUp className="w-5 h-5 text-[#888888]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#888888]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSeasons.has(season.id) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3">
                          {season.episodes.map((episode, index) => (
                            <div key={episode.id}>
                              <button
                                onClick={() => playEpisode(episode)}
                                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                                  currentEpisode?.id === episode.id
                                    ? "bg-[#00FFFF]/20 border border-[#00FFFF]/30"
                                    : "bg-[#0B0C10] hover:bg-white/5 border border-transparent"
                                }`}
                              >
                                <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={episode.thumbnailUrl || series.posterUrl}
                                    alt={episode.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                    {episode.duration ? `${episode.duration}m` : "N/A"}
                                  </div>
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#00FFFF] text-sm font-medium">E{episode.episodeNumber}</span>
                                    <h4 className="text-white font-medium line-clamp-1">{episode.title}</h4>
                                  </div>
                                  {episode.description && (
                                    <p className="text-[#888888] text-sm mt-1 line-clamp-2">{episode.description}</p>
                                  )}
                                </div>
                              </button>

                              {/* Ad after every 3 episodes */}
                              {(index + 1) % 3 === 0 && index !== season.episodes.length - 1 && (
                                <div className="py-3">
                                  <AdBannerClient className="h-20 rounded-lg" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Ad Banner */}
            <div className="py-4">{adBannerHorizontal}</div>

            {/* Comments Section */}
            <div className="bg-[#1A1B23] rounded-xl border border-[#2A2B33] p-6">
              <h3 className="text-xl font-bold text-white mb-6">Comments ({comments.length})</h3>

              {/* Add Comment */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#888888] text-sm">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setCommentRating(star)}>
                        <Star
                          className={`w-5 h-5 ${star <= commentRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts about this series..."
                    className="flex-1 bg-[#0B0C10] border border-[#2A2B33] rounded-xl p-4 text-white placeholder:text-[#888888] focus:outline-none focus:border-[#00FFFF]/50 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmitting || !commentText.trim()}
                    className="px-6 bg-[#00FFFF] text-black font-bold rounded-xl hover:bg-[#00FFFF]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-[#888888] text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-[#0B0C10] rounded-xl p-4 border border-[#2A2B33]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFFF] to-purple-500 flex items-center justify-center text-white font-bold">
                            {comment.user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{comment.user.displayName}</p>
                            <p className="text-[#888888] text-xs">{new Date(comment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {comment.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= comment.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ad Banner */}
            {adBannerVertical}

            {/* Series Info Card */}
            <div className="bg-[#1A1B23] rounded-xl border border-[#2A2B33] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Series Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Status</dt>
                  <dd className="text-white capitalize">{series.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Release Year</dt>
                  <dd className="text-white">{series.releaseYear}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Seasons</dt>
                  <dd className="text-white">{series.totalSeasons}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Episodes</dt>
                  <dd className="text-white">{series.totalEpisodes}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Rating</dt>
                  <dd className="text-white flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {rating.toFixed(1)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Views</dt>
                  <dd className="text-white">{series.views.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#888888]">Likes</dt>
                  <dd className="text-white flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                    {likesCount}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Another Ad */}
            <div className="sticky top-24">
              <AdBannerClient className="h-[300px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
