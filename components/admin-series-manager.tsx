"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronUp, Play, Loader, Tv, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  createSeries,
  updateSeries,
  deleteSeries,
  createSeason,
  updateSeason,
  deleteSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getAdminSeries,
} from "@/lib/series-actions"

interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string | null
  duration: number | null
  videoUrl: string | null
  thumbnailUrl: string | null
}

interface Season {
  id: string
  seasonNumber: number
  title: string | null
  description: string | null
  episodes: Episode[]
}

interface Series {
  id: string
  title: string
  description: string | null
  posterUrl: string | null
  bannerUrl: string | null
  genre: string | null
  status: string
  releaseYear: number | null
  rating: string | null
  seasons: Season[]
}

export function AdminSeriesManager() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null)
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null)

  // Modal states
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [currentSeriesId, setCurrentSeriesId] = useState<string | null>(null)
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [seriesForm, setSeriesForm] = useState({
    title: "",
    description: "",
    posterUrl: "",
    bannerUrl: "",
    genre: "",
    status: "ongoing",
    releaseYear: new Date().getFullYear(),
  })
  const [seasonForm, setSeasonForm] = useState({
    seasonNumber: 1,
    title: "",
    description: "",
  })
  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: 1,
    title: "",
    description: "",
    duration: 0,
    videoUrl: "",
    thumbnailUrl: "",
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
      console.error("Failed to load series:", error)
      toast.error("Failed to load series")
    } finally {
      setLoading(false)
    }
  }

  const filteredSeries = seriesList.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.genre?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Series CRUD
  const handleSaveSeries = async () => {
    if (!seriesForm.title || !seriesForm.description || !seriesForm.posterUrl || !seriesForm.genre) {
      toast.error("Please fill in all required fields")
      return
    }
    setSaving(true)
    try {
      if (editingSeries) {
        const result = await updateSeries(editingSeries.id, seriesForm)
        if (result.success) {
          toast.success("Series updated successfully")
        } else {
          toast.error(result.error || "Failed to update series")
        }
      } else {
        const result = await createSeries(seriesForm)
        if (result.success) {
          toast.success("Series created successfully")
        } else {
          toast.error(result.error || "Failed to create series")
        }
      }
      setShowSeriesModal(false)
      resetSeriesForm()
      loadSeries()
    } catch (error) {
      toast.error("Failed to save series")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSeries = async (id: string) => {
    if (!confirm("Are you sure? This will delete all seasons and episodes.")) return
    try {
      const result = await deleteSeries(id)
      if (result.success) {
        toast.success("Series deleted")
        loadSeries()
      } else {
        toast.error(result.error || "Failed to delete series")
      }
    } catch (error) {
      toast.error("Failed to delete series")
    }
  }

  const openEditSeries = (s: Series) => {
    setEditingSeries(s)
    setSeriesForm({
      title: s.title,
      description: s.description || "",
      posterUrl: s.posterUrl || "",
      bannerUrl: s.bannerUrl || "",
      genre: s.genre || "",
      status: s.status,
      releaseYear: s.releaseYear || new Date().getFullYear(),
    })
    setShowSeriesModal(true)
  }

  const resetSeriesForm = () => {
    setEditingSeries(null)
    setSeriesForm({
      title: "",
      description: "",
      posterUrl: "",
      bannerUrl: "",
      genre: "",
      status: "ongoing",
      releaseYear: new Date().getFullYear(),
    })
  }

  // Season CRUD
  const handleSaveSeason = async () => {
    if (!currentSeriesId) return
    setSaving(true)
    try {
      if (editingSeason) {
        const result = await updateSeason(editingSeason.id, seasonForm)
        if (result.success) {
          toast.success("Season updated successfully")
        } else {
          toast.error(result.error || "Failed to update season")
        }
      } else {
        const result = await createSeason({
          seriesId: currentSeriesId,
          ...seasonForm,
        })
        if (result.success) {
          toast.success("Season created successfully")
        } else {
          toast.error(result.error || "Failed to create season")
        }
      }
      setShowSeasonModal(false)
      resetSeasonForm()
      loadSeries()
    } catch (error) {
      toast.error("Failed to save season")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSeason = async (id: string) => {
    if (!confirm("Are you sure? This will delete all episodes.")) return
    try {
      const result = await deleteSeason(id)
      if (result.success) {
        toast.success("Season deleted")
        loadSeries()
      } else {
        toast.error(result.error || "Failed to delete season")
      }
    } catch (error) {
      toast.error("Failed to delete season")
    }
  }

  const openAddSeason = (seriesId: string) => {
    setCurrentSeriesId(seriesId)
    const s = seriesList.find((x) => x.id === seriesId)
    const nextSeasonNum = s ? s.seasons.length + 1 : 1
    setSeasonForm({ seasonNumber: nextSeasonNum, title: "", description: "" })
    setShowSeasonModal(true)
  }

  const openEditSeason = (seriesId: string, season: Season) => {
    setCurrentSeriesId(seriesId)
    setEditingSeason(season)
    setSeasonForm({
      seasonNumber: season.seasonNumber,
      title: season.title || "",
      description: season.description || "",
    })
    setShowSeasonModal(true)
  }

  const resetSeasonForm = () => {
    setEditingSeason(null)
    setSeasonForm({ seasonNumber: 1, title: "", description: "" })
  }

  // Episode CRUD
  const handleSaveEpisode = async () => {
    if (!currentSeasonId || !episodeForm.title || !episodeForm.videoUrl) {
      toast.error("Please fill in all required fields")
      return
    }
    setSaving(true)
    try {
      if (editingEpisode) {
        const result = await updateEpisode(editingEpisode.id, episodeForm)
        if (result.success) {
          toast.success("Episode updated successfully")
        } else {
          toast.error(result.error || "Failed to update episode")
        }
      } else {
        const result = await createEpisode({
          seasonId: currentSeasonId,
          ...episodeForm,
        })
        if (result.success) {
          toast.success("Episode created successfully")
        } else {
          toast.error(result.error || "Failed to create episode")
        }
      }
      setShowEpisodeModal(false)
      resetEpisodeForm()
      loadSeries()
    } catch (error) {
      toast.error("Failed to save episode")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode?")) return
    try {
      const result = await deleteEpisode(id)
      if (result.success) {
        toast.success("Episode deleted")
        loadSeries()
      } else {
        toast.error(result.error || "Failed to delete episode")
      }
    } catch (error) {
      toast.error("Failed to delete episode")
    }
  }

  const openAddEpisode = (seasonId: string, currentEpisodeCount: number) => {
    setCurrentSeasonId(seasonId)
    setEpisodeForm({
      episodeNumber: currentEpisodeCount + 1,
      title: "",
      description: "",
      duration: 0,
      videoUrl: "",
      thumbnailUrl: "",
    })
    setShowEpisodeModal(true)
  }

  const openEditEpisode = (seasonId: string, episode: Episode) => {
    setCurrentSeasonId(seasonId)
    setEditingEpisode(episode)
    setEpisodeForm({
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description || "",
      duration: episode.duration || 0,
      videoUrl: episode.videoUrl || "",
      thumbnailUrl: episode.thumbnailUrl || "",
    })
    setShowEpisodeModal(true)
  }

  const resetEpisodeForm = () => {
    setEditingEpisode(null)
    setEpisodeForm({
      episodeNumber: 1,
      title: "",
      description: "",
      duration: 0,
      videoUrl: "",
      thumbnailUrl: "",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-cyan-500/50"
          />
          <Search className="w-5 h-5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <button
          onClick={() => {
            resetSeriesForm()
            setShowSeriesModal(true)
          }}
          className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Series
        </button>
      </div>

      {/* Series List */}
      <div className="space-y-4">
        {filteredSeries.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No series found. Add your first series!</p>
          </div>
        ) : (
          filteredSeries.map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Series Header */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedSeries(expandedSeries === s.id ? null : s.id)}
              >
                <img
                  src={s.posterUrl || "/placeholder.svg?height=80&width=60&query=tv+series+poster"}
                  alt={s.title}
                  className="w-14 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{s.title}</h3>
                  <p className="text-white/50 text-sm">
                    {s.releaseYear} • {s.genre} • {s.seasons.length} season(s)
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                      s.status === "ongoing"
                        ? "bg-green-500/20 text-green-400"
                        : s.status === "completed"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditSeries(s)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4 text-white/70" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSeries(s.id)
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  {expandedSeries === s.id ? (
                    <ChevronUp className="w-5 h-5 text-white/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  )}
                </div>
              </div>

              {/* Seasons */}
              <AnimatePresence>
                {expandedSeries === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-white/70 font-semibold">Seasons</h4>
                        <button
                          onClick={() => openAddSeason(s.id)}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm flex items-center gap-1 hover:bg-cyan-500/30"
                        >
                          <Plus className="w-3 h-3" />
                          Add Season
                        </button>
                      </div>

                      {s.seasons.length === 0 ? (
                        <p className="text-white/40 text-sm py-4 text-center">No seasons yet</p>
                      ) : (
                        s.seasons.map((season) => (
                          <div key={season.id} className="bg-white/5 rounded-xl overflow-hidden">
                            {/* Season Header */}
                            <div
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                              onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                  <span className="text-cyan-400 font-bold text-sm">S{season.seasonNumber}</span>
                                </div>
                                <div>
                                  <p className="text-white font-medium">
                                    {season.title || `Season ${season.seasonNumber}`}
                                  </p>
                                  <p className="text-white/40 text-xs">{season.episodes.length} episode(s)</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditSeason(s.id, season)
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded-lg"
                                >
                                  <Edit className="w-3 h-3 text-white/50" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSeason(season.id)
                                  }}
                                  className="p-1.5 hover:bg-red-500/20 rounded-lg"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                                {expandedSeason === season.id ? (
                                  <ChevronUp className="w-4 h-4 text-white/30" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-white/30" />
                                )}
                              </div>
                            </div>

                            {/* Episodes */}
                            <AnimatePresence>
                              {expandedSeason === season.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/10 p-3 space-y-2"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white/50 text-xs">Episodes</span>
                                    <button
                                      onClick={() => openAddEpisode(season.id, season.episodes.length)}
                                      className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs flex items-center gap-1 hover:bg-white/20"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add Episode
                                    </button>
                                  </div>

                                  {season.episodes.length === 0 ? (
                                    <p className="text-white/30 text-xs text-center py-2">No episodes yet</p>
                                  ) : (
                                    season.episodes.map((ep) => (
                                      <div key={ep.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                        <div className="w-16 h-10 bg-black/50 rounded overflow-hidden flex-shrink-0">
                                          {ep.thumbnailUrl ? (
                                            <img
                                              src={ep.thumbnailUrl || "/placeholder.svg"}
                                              alt={ep.title}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Play className="w-4 h-4 text-white/30" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-white text-sm truncate">
                                            E{ep.episodeNumber}: {ep.title}
                                          </p>
                                          <p className="text-white/40 text-xs">
                                            {ep.duration ? `${ep.duration} min` : "N/A"}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditEpisode(season.id, ep)}
                                            className="p-1 hover:bg-white/10 rounded"
                                          >
                                            <Edit className="w-3 h-3 text-white/50" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteEpisode(ep.id)}
                                            className="p-1 hover:bg-red-500/20 rounded"
                                          >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingSeries ? "Edit Series" : "Add New Series"}</h3>
              <button onClick={() => setShowSeriesModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
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
                <label className="text-white/70 text-sm mb-1 block">Description *</label>
                <textarea
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 min-h-[100px]"
                  placeholder="Series description"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Poster URL *</label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Genre *</label>
                  <input
                    type="text"
                    value={seriesForm.genre}
                    onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="Drama, Action..."
                  />
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingSeason ? "Edit Season" : "Add New Season"}</h3>
              <button onClick={() => setShowSeasonModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
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
                  placeholder="e.g., The Beginning"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Description (optional)</label>
                <textarea
                  value={seasonForm.description}
                  onChange={(e) => setSeasonForm({ ...seasonForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Season description"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingEpisode ? "Edit Episode" : "Add New Episode"}</h3>
              <button onClick={() => setShowEpisodeModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
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
