"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Tv, X, ChevronDown, ChevronUp, Loader, Bell, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  getAdminSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  createSeason,
  updateSeason,
  deleteSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from "@/lib/series-actions"
import { createNotificationForAllUsers } from "@/lib/server-actions"

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string | null
  duration: number | null
  videoUrl: string | null
  thumbnailUrl: string | null
  downloadEnabled?: boolean
  downloadUrl?: string | null
}

interface Season {
  id: string
  seasonNumber: number
  title: string | null
  episodes: Episode[]
}

interface Series {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  bannerUrl: string | null
  genre: string | null
  releaseYear: number | null
  status: string
  seasons: Season[]
}

export function AdminSeriesManager() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null)
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null)

  // Modal states
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)

  // Edit states
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  // Notification state
  const [notifyOnCreate, setNotifyOnCreate] = useState(true)

  // Form states
  const [seriesForm, setSeriesForm] = useState({
    title: "",
    description: "",
    posterUrl: "",
    bannerUrl: "",
    genre: "Drama",
    releaseYear: new Date().getFullYear(),
    status: "ongoing",
  })

  const [seasonForm, setSeasonForm] = useState({
    seasonNumber: 1,
    title: "",
  })

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: 1,
    title: "",
    description: "",
    duration: 0,
    videoUrl: "",
    thumbnailUrl: "",
    downloadEnabled: false,
    downloadUrl: "",
  })

  useEffect(() => {
    loadSeries()
  }, [])

  const loadSeries = async () => {
    setLoading(true)
    try {
      const data = await getAdminSeries()
      setSeriesList(data)
    } catch (error) {
      console.error("Error loading series:", error)
      toast.error("Failed to load series")
    }
    setLoading(false)
  }

  const handleSaveSeries = async () => {
    if (!seriesForm.title) {
      toast.error("Title is required")
      return
    }

    setSaving(true)
    try {
      if (editingSeries) {
        await updateSeries(editingSeries.id, seriesForm)
        toast.success("Series updated")
      } else {
        const result = await createSeries(seriesForm)
        if (result.success && notifyOnCreate) {
          await createNotificationForAllUsers(
            `New Series: ${seriesForm.title}`,
            `${seriesForm.title} is now available to watch on moBix!`,
            "new_series",
            result.series?.id,
          )
        }
        toast.success("Series created")
      }
      await loadSeries()
      setShowSeriesModal(false)
      resetSeriesForm()
    } catch (error) {
      toast.error("Failed to save series")
    }
    setSaving(false)
  }

  const handleSaveSeason = async () => {
    if (!selectedSeriesId) return

    setSaving(true)
    try {
      if (editingSeason) {
        await updateSeason(editingSeason.id, seasonForm)
        toast.success("Season updated")
      } else {
        await createSeason(selectedSeriesId, seasonForm)
        toast.success("Season created")
      }
      await loadSeries()
      setShowSeasonModal(false)
      resetSeasonForm()
    } catch (error) {
      toast.error("Failed to save season")
    }
    setSaving(false)
  }

  const handleSaveEpisode = async () => {
    if (!selectedSeasonId || !episodeForm.title || !episodeForm.videoUrl) {
      toast.error("Title and Video URL are required")
      return
    }

    setSaving(true)
    try {
      const episodeData = {
        ...episodeForm,
        downloadEnabled: episodeForm.downloadEnabled,
        downloadUrl: episodeForm.downloadEnabled ? episodeForm.downloadUrl : null,
      }

      if (editingEpisode) {
        await updateEpisode(editingEpisode.id, episodeData)
        toast.success("Episode updated")
      } else {
        await createEpisode(selectedSeasonId, episodeData)
        toast.success("Episode created")
      }
      await loadSeries()
      setShowEpisodeModal(false)
      resetEpisodeForm()
    } catch (error) {
      toast.error("Failed to save episode")
    }
    setSaving(false)
  }

  const handleDeleteSeries = async (id: string) => {
    if (!confirm("Delete this series and all its content?")) return
    try {
      await deleteSeries(id)
      toast.success("Series deleted")
      await loadSeries()
    } catch (error) {
      toast.error("Failed to delete series")
    }
  }

  const handleDeleteSeason = async (id: string) => {
    if (!confirm("Delete this season and all episodes?")) return
    try {
      await deleteSeason(id)
      toast.success("Season deleted")
      await loadSeries()
    } catch (error) {
      toast.error("Failed to delete season")
    }
  }

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm("Delete this episode?")) return
    try {
      await deleteEpisode(id)
      toast.success("Episode deleted")
      await loadSeries()
    } catch (error) {
      toast.error("Failed to delete episode")
    }
  }

  const resetSeriesForm = () => {
    setSeriesForm({
      title: "",
      description: "",
      posterUrl: "",
      bannerUrl: "",
      genre: "Drama",
      releaseYear: new Date().getFullYear(),
      status: "ongoing",
    })
    setEditingSeries(null)
  }

  const resetSeasonForm = () => {
    setSeasonForm({ seasonNumber: 1, title: "" })
    setEditingSeason(null)
  }

  const resetEpisodeForm = () => {
    setEpisodeForm({
      episodeNumber: 1,
      title: "",
      description: "",
      duration: 0,
      videoUrl: "",
      thumbnailUrl: "",
      downloadEnabled: false,
      downloadUrl: "",
    })
    setEditingEpisode(null)
  }

  const openEditSeries = (s: Series) => {
    setEditingSeries(s)
    setSeriesForm({
      title: s.title,
      description: s.description || "",
      posterUrl: s.posterUrl || "",
      bannerUrl: s.bannerUrl || "",
      genre: s.genre || "Drama",
      releaseYear: s.releaseYear || new Date().getFullYear(),
      status: s.status || "ongoing",
    })
    setShowSeriesModal(true)
  }

  const openEditSeason = (season: Season, seriesId: string) => {
    setEditingSeason(season)
    setSelectedSeriesId(seriesId)
    setSeasonForm({
      seasonNumber: season.seasonNumber,
      title: season.title || "",
    })
    setShowSeasonModal(true)
  }

  const openEditEpisode = (episode: Episode, seasonId: string) => {
    setEditingEpisode(episode)
    setSelectedSeasonId(seasonId)
    setEpisodeForm({
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description || "",
      duration: episode.duration || 0,
      videoUrl: episode.videoUrl || "",
      thumbnailUrl: episode.thumbnailUrl || "",
      downloadEnabled: episode.downloadEnabled || false,
      downloadUrl: episode.downloadUrl || "",
    })
    setShowEpisodeModal(true)
  }

  const openAddSeason = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    resetSeasonForm()
    setShowSeasonModal(true)
  }

  const openAddEpisode = (seasonId: string) => {
    setSelectedSeasonId(seasonId)
    resetEpisodeForm()
    setShowEpisodeModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-cyan-400" />
          TV Series ({seriesList.length})
        </h3>
        <button
          onClick={() => {
            resetSeriesForm()
            setShowSeriesModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
        >
          <Plus className="w-4 h-4" />
          Add Series
        </button>
      </div>

      {/* Series List */}
      <div className="space-y-4">
        {seriesList.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Tv className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No series yet. Add your first series!</p>
          </div>
        ) : (
          seriesList.map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Series Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedSeries(expandedSeries === s.id ? null : s.id)}
              >
                <div className="w-16 h-24 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                  {s.posterUrl ? (
                    <img src={s.posterUrl || "/placeholder.svg"} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold truncate">{s.title}</h4>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <span>{s.genre}</span>
                    <span>•</span>
                    <span>{s.releaseYear}</span>
                    <span>•</span>
                    <span className="capitalize">{s.status}</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">
                    {s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""} •{" "}
                    {s.seasons.reduce((acc, season) => acc + season.episodes.length, 0)} episodes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditSeries(s)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-cyan-400 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSeries(s.id)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedSeries === s.id ? (
                    <ChevronUp className="w-5 h-5 text-white/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  )}
                </div>
              </div>

              {/* Seasons (Expanded) */}
              <AnimatePresence>
                {expandedSeries === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-white/70 text-sm font-medium">Seasons</h5>
                        <button
                          onClick={() => openAddSeason(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-sm rounded-lg hover:bg-cyan-500/30 transition"
                        >
                          <Plus className="w-3 h-3" />
                          Add Season
                        </button>
                      </div>

                      {s.seasons.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-4">No seasons yet</p>
                      ) : (
                        s.seasons.map((season) => (
                          <div key={season.id} className="bg-white/5 rounded-xl overflow-hidden">
                            {/* Season Header */}
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                              onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  Season {season.seasonNumber}
                                  {season.title && `: ${season.title}`}
                                </span>
                                <span className="text-white/40 text-sm">({season.episodes.length} episodes)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditSeason(season, s.id)
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-cyan-400 transition"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSeason(season.id)
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-red-400 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {expandedSeason === season.id ? (
                                  <ChevronUp className="w-4 h-4 text-white/50" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-white/50" />
                                )}
                              </div>
                            </div>

                            {/* Episodes (Expanded) */}
                            <AnimatePresence>
                              {expandedSeason === season.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/10"
                                >
                                  <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-white/50 text-xs">Episodes</span>
                                      <button
                                        onClick={() => openAddEpisode(season.id)}
                                        className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30 transition"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add Episode
                                      </button>
                                    </div>

                                    {season.episodes.length === 0 ? (
                                      <p className="text-white/40 text-xs text-center py-2">No episodes yet</p>
                                    ) : (
                                      season.episodes.map((ep) => (
                                        <div
                                          key={ep.id}
                                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-white/50 text-xs font-bold">
                                              {ep.episodeNumber}
                                            </div>
                                            <div>
                                              <p className="text-white text-sm">{ep.title}</p>
                                              <div className="flex items-center gap-2 text-white/40 text-xs">
                                                {ep.duration && <span>{ep.duration} min</span>}
                                                {ep.downloadEnabled && (
                                                  <span className="flex items-center gap-1 text-green-400">
                                                    <Download className="w-3 h-3" />
                                                    Download
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => openEditEpisode(ep, season.id)}
                                              className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-cyan-400 transition"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteEpisode(ep.id)}
                                              className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-red-400 transition"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Series Modal */}
      {showSeriesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1B23] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingSeries ? "Edit Series" : "Add New Series"}</h3>
              <button onClick={() => setShowSeriesModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-1 block">Title *</label>
                <input
                  type="text"
                  value={seriesForm.title}
                  onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Series title"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Description</label>
                <textarea
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Series description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Poster URL</label>
                  <input
                    type="text"
                    value={seriesForm.posterUrl}
                    onChange={(e) => setSeriesForm({ ...seriesForm, posterUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Banner URL</label>
                  <input
                    type="text"
                    value={seriesForm.bannerUrl}
                    onChange={(e) => setSeriesForm({ ...seriesForm, bannerUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Genre</label>
                  <select
                    value={seriesForm.genre}
                    onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Drama">Drama</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Action">Action</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Romance">Romance</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Horror">Horror</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Year</label>
                  <input
                    type="number"
                    value={seriesForm.releaseYear}
                    onChange={(e) => setSeriesForm({ ...seriesForm, releaseYear: Number.parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Status</label>
                  <select
                    value={seriesForm.status}
                    onChange={(e) => setSeriesForm({ ...seriesForm, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Notify users checkbox */}
              {!editingSeries && (
                <div className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="notifyOnCreate"
                    checked={notifyOnCreate}
                    onChange={(e) => setNotifyOnCreate(e.target.checked)}
                    className="w-5 h-5 rounded border-cyan-500/30 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <label htmlFor="notifyOnCreate" className="text-white flex-1">
                    <span className="font-medium">Notify all users</span>
                    <span className="text-white/50 text-sm block">Send notification when series is created</span>
                  </label>
                  <Bell className="w-5 h-5 text-cyan-400" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowSeriesModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSeries}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {editingSeries ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Season Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1B23] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingSeason ? "Edit Season" : "Add New Season"}</h3>
              <button onClick={() => setShowSeasonModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-1 block">Season Number</label>
                <input
                  type="number"
                  value={seasonForm.seasonNumber}
                  onChange={(e) => setSeasonForm({ ...seasonForm, seasonNumber: Number.parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Title (optional)</label>
                <input
                  type="text"
                  value={seasonForm.title}
                  onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="e.g. The Beginning"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowSeasonModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSeason}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {editingSeason ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episode Modal */}
      {showEpisodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1B23] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingEpisode ? "Edit Episode" : "Add New Episode"}</h3>
              <button onClick={() => setShowEpisodeModal(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Episode Number</label>
                  <input
                    type="number"
                    value={episodeForm.episodeNumber}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, episodeNumber: Number.parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={episodeForm.duration}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, duration: Number.parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Title *</label>
                <input
                  type="text"
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Episode title"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Description</label>
                <textarea
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Episode description"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Video URL *</label>
                <input
                  type="text"
                  value={episodeForm.videoUrl}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, videoUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Thumbnail URL</label>
                <input
                  type="text"
                  value={episodeForm.thumbnailUrl}
                  onChange={(e) => setEpisodeForm({ ...episodeForm, thumbnailUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="https://..."
                />
              </div>

              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="downloadEnabled"
                    checked={episodeForm.downloadEnabled}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, downloadEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-green-500/30 bg-white/5 text-green-500 focus:ring-green-500/50"
                  />
                  <label htmlFor="downloadEnabled" className="text-white flex-1">
                    <span className="font-medium">Enable Download</span>
                    <span className="text-white/50 text-sm block">Allow users to download this episode</span>
                  </label>
                  <Download className="w-5 h-5 text-green-400" />
                </div>

                {episodeForm.downloadEnabled && (
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">Download URL</label>
                    <input
                      type="text"
                      value={episodeForm.downloadUrl}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, downloadUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                      placeholder="https://download-link.com/episode.mp4"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowEpisodeModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEpisode}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {editingEpisode ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSeriesManager
