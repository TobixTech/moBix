"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Play, Plus, Check, ChevronDown, ChevronUp, Star, Calendar, Tv, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ProductionVideoPlayer from "@/components/production-video-player"
import StarRating from "@/components/star-rating"
import { addToSeriesWatchlist, removeFromSeriesWatchlist, rateSeriesAction } from "@/lib/series-actions"
import { toast } from "sonner"

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description?: string
  duration?: number
  thumbnailUrl?: string
  videoUrl: string
}

interface Season {
  id: string
  seasonNumber: number
  title?: string
  description?: string
  episodes: Episode[]
}

interface Series {
  id: string
  slug?: string
  title: string
  description: string
  posterUrl: string
  bannerUrl?: string
  genre: string
  releaseYear: number
  status: string
  totalSeasons: number
  totalEpisodes: number
  averageRating?: string | number | null
  views: number
  seasons: Season[]
}

interface SeriesDetailClientProps {
  series: Series
  inWatchlist: boolean
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
  adSettings,
  adBannerHorizontal,
  adBannerVertical,
}: SeriesDetailClientProps) {
  const { isSignedIn } = useUser()
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(series.seasons[0] || null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set([series.seasons[0]?.id]))
  const [userRating, setUserRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

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
    } catch (error) {
      toast.error("Failed to update watchlist")
    }
    setIsLoading(false)
  }

  const handleRating = async (rating: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate")
      return
    }

    setUserRating(rating)
    const result = await rateSeriesAction(series.id, rating)
    if (result.success) {
      toast.success("Rating saved")
    }
  }

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev)
      if (next.has(seasonId)) {
        next.delete(seasonId)
      } else {
        next.add(seasonId)
      }
      return next
    })
  }

  const playEpisode = (episode: Episode) => {
    setCurrentEpisode(episode)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="pt-16">
      {/* Banner/Player Section */}
      <div className="relative">
        {currentEpisode ? (
          <div className="w-full aspect-video bg-black">
            <ProductionVideoPlayer
              src={currentEpisode.videoUrl}
              poster={currentEpisode.thumbnailUrl || series.bannerUrl || series.posterUrl}
              title={`${series.title} - S${selectedSeason?.seasonNumber}E${currentEpisode.episodeNumber}: ${currentEpisode.title}`}
              movieId={series.id}
              prerollAdCodes={adSettings.prerollEnabled ? adSettings.prerollAdCodes : []}
              midrollAdCodes={adSettings.midrollEnabled ? adSettings.midrollAdCodes : []}
              midrollEnabled={adSettings.midrollEnabled}
              midrollIntervalMinutes={adSettings.midrollIntervalMinutes}
            />
          </div>
        ) : (
          <div
            className="w-full h-[50vh] md:h-[60vh] bg-cover bg-center relative"
            style={{
              backgroundImage: `url(${series.bannerUrl || series.posterUrl})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-transparent to-transparent" />
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="hidden md:block flex-shrink-0">
            <img
              src={series.posterUrl || "/placeholder.svg"}
              alt={series.title}
              className="w-64 h-96 object-cover rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-32 md:pt-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium flex items-center gap-1">
                <Tv className="w-4 h-4" />
                TV Series
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  series.status === "ongoing"
                    ? "bg-green-500/20 text-green-400"
                    : series.status === "completed"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-red-500/20 text-red-400"
                }`}
              >
                {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{series.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-white/70 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{series.releaseYear}</span>
              </div>
              <span>•</span>
              <span>{series.genre}</span>
              <span>•</span>
              <span>
                {series.totalSeasons} Season{series.totalSeasons !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                {series.totalEpisodes} Episode{series.totalEpisodes !== 1 ? "s" : ""}
              </span>
            </div>

            {rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={rating} size="lg" showValue />
                <span className="text-white/50">({series.views.toLocaleString()} views)</span>
              </div>
            )}

            <p className="text-white/80 text-lg mb-6 max-w-3xl">{series.description}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-8">
              {series.seasons.length > 0 && series.seasons[0].episodes.length > 0 && (
                <button
                  onClick={() => playEpisode(series.seasons[0].episodes[0])}
                  className="flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
                >
                  <Play className="w-6 h-6" />
                  Play S1:E1
                </button>
              )}

              <button
                onClick={handleWatchlistToggle}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition ${
                  inWatchlist
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>
            </div>

            {/* Rate */}
            {isSignedIn && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-white/70">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => handleRating(star)} className="p-1">
                      <Star
                        className={`w-6 h-6 transition ${
                          star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-white/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {adBannerHorizontal}

        {/* Seasons & Episodes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Seasons & Episodes</h2>

          <div className="space-y-4">
            {series.seasons.map((season) => (
              <div key={season.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* Season Header */}
                <button
                  onClick={() => toggleSeason(season.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-cyan-400 font-bold">{season.seasonNumber}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold">
                        Season {season.seasonNumber}
                        {season.title && `: ${season.title}`}
                      </h3>
                      <p className="text-white/50 text-sm">
                        {season.episodes.length} Episode{season.episodes.length !== 1 ? "s" : ""}
                        {season.releaseYear && ` • ${season.releaseYear}`}
                      </p>
                    </div>
                  </div>
                  {expandedSeasons.has(season.id) ? (
                    <ChevronUp className="w-5 h-5 text-white/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  )}
                </button>

                {/* Episodes List */}
                <AnimatePresence>
                  {expandedSeasons.has(season.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10"
                    >
                      {season.episodes.map((episode) => (
                        <div
                          key={episode.id}
                          className={`flex items-center gap-4 p-4 hover:bg-white/5 transition cursor-pointer border-b border-white/5 last:border-b-0 ${
                            currentEpisode?.id === episode.id ? "bg-cyan-500/10" : ""
                          }`}
                          onClick={() => {
                            setSelectedSeason(season)
                            playEpisode(episode)
                          }}
                        >
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-white/10">
                            {episode.thumbnailUrl ? (
                              <img
                                src={episode.thumbnailUrl || "/placeholder.svg"}
                                alt={episode.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-white/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">
                              E{episode.episodeNumber}. {episode.title}
                            </h4>
                            {episode.description && (
                              <p className="text-white/50 text-sm line-clamp-2 mt-1">{episode.description}</p>
                            )}
                          </div>

                          {/* Duration */}
                          {episode.duration && (
                            <div className="flex items-center gap-1 text-white/50 text-sm flex-shrink-0">
                              <Clock className="w-4 h-4" />
                              <span>{episode.duration}m</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">{adBannerHorizontal}</div>
      </div>
    </div>
  )
}
