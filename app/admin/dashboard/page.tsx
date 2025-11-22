"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  LayoutDashboard,
  Film,
  Upload,
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Menu,
  X,
  MessageSquare,
  Lock,
  Loader,
  Settings,
  Save,
} from "lucide-react"
import { useAuth, SignOutButton } from "@clerk/nextjs"
import { motion } from "framer-motion"
import {
  getAdminMetrics,
  getTrendingMovies,
  getRecentSignups,
  getAdminMovies,
  getAdminUsers,
  uploadMovie,
  updateMovie,
  deleteMovie,
  getAdSettings, // Added import for getAdSettings
  updateAdSettings, // Added import for updateAdSettings
} from "@/lib/server-actions"

type AdminTab = "overview" | "movies" | "upload" | "users" | "comments" | "ads"

interface Metric {
  label: string
  value: string
  change: string
}

interface Movie {
  id: number
  title: string
  views?: string
  genre?: string
  uploadDate?: string
  status?: string
  downloadEnabled?: boolean // Added downloadEnabled
  downloadUrl?: string // Added downloadUrl
  customVastUrl?: string // Added customVastUrl
  useGlobalAd?: boolean // Added useGlobalAd
  description?: string // Added description
  thumbnail?: string // Added thumbnail for edit modal
  videoLink?: string // Added videoLink for edit modal
  year?: number // Added year for edit modal
  posterUrl?: string // Added posterUrl for edit modal
  videoUrl?: string // Added videoUrl for edit modal
}

interface Signup {
  id: number
  email: string
  date: string
}

interface User {
  id: number
  email: string
  dateJoined: string
  role: string
}

interface Comment {
  id: string
  text: string
  rating: number
  movieTitle: string
  userEmail: string
  createdAt: string
  movieId: string
}

export default function AdminDashboard() {
  const [pinVerified, setPinVerified] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinLoading, setPinLoading] = useState(false)

  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [movieSearch, setMovieSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [metrics, setMetrics] = useState<Metric[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [recentSignups, setRecentSignups] = useState<Signup[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const [adSettings, setAdSettings] = useState({
    horizontalAdCode: "",
    verticalAdCode: "",
    vastUrl: "",
    adTimeout: 20,
    showPrerollAds: true,
    showHomepageAds: true,
    showMovieDetailAds: true,
  })

  // Added ad settings and download settings to formData
  const [formData, setFormData] = useState({
    title: "",
    thumbnail: "",
    videoLink: "",
    description: "",
    genre: "Action",
    releaseDate: "",
    status: "draft",
    downloadEnabled: false,
    downloadUrl: "",
    customVastUrl: "",
    useGlobalAd: true,
  })

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")
    setPinLoading(true)

    try {
      const response = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      })

      const result = await response.json()

      if (result.success) {
        setPinVerified(true)
        setPinInput("")
      } else {
        setPinError("Invalid PIN. Please try again.")
      }
    } catch (error) {
      setPinError("An error occurred. Please try again.")
    } finally {
      setPinLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, trendingData, signupsData, moviesData, usersData, adSettingsData] = await Promise.all([
          getAdminMetrics(),
          getTrendingMovies(),
          getRecentSignups(),
          getAdminMovies(),
          getAdminUsers(),
          getAdSettings(), // Added call to getAdSettings
        ])
        setMetrics(metricsData)
        setTrendingMovies(trendingData)
        setRecentSignups(signupsData)
        setMovies(moviesData)
        setUsers(usersData)

        if (adSettingsData) {
          setAdSettings({
            horizontalAdCode: adSettingsData.horizontalAdCode || "",
            verticalAdCode: adSettingsData.verticalAdCode || "",
            vastUrl: adSettingsData.vastPrerollUrl || "", // Corrected from vastUrl to vastPrerollUrl
            adTimeout: adSettingsData.adTimeout || 20, // Corrected from adTimeoutSeconds to adTimeout
            showPrerollAds: adSettingsData.adsEnabled ?? true, // Assuming adsEnabled controls preroll
            showHomepageAds: adSettingsData.homepageEnabled ?? true,
            showMovieDetailAds: adSettingsData.movieDetailEnabled ?? true,
          })
        }

        const commentsResponse = await fetch("/api/admin/comments")
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (pinVerified) {
      fetchData()
    }
  }, [pinVerified])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await uploadMovie({
      title: formData.title,
      description: formData.description,
      year: Number.parseInt(formData.releaseDate.split("-")[0]),
      genre: formData.genre,
      posterUrl: formData.thumbnail,
      videoUrl: formData.videoLink,
      isFeatured: formData.status === "published",
      downloadEnabled: formData.downloadEnabled,
      downloadUrl: formData.downloadUrl,
      customVastUrl: formData.customVastUrl,
      useGlobalAd: formData.useGlobalAd,
    })

    if (result.success) {
      setFormData({
        title: "",
        thumbnail: "",
        videoLink: "",
        description: "",
        genre: "Action",
        releaseDate: "",
        status: "draft",
        downloadEnabled: false,
        downloadUrl: "",
        customVastUrl: "",
        useGlobalAd: true,
      })

      const moviesData = await getAdminMovies()
      setMovies(moviesData)

      setActiveTab("movies")
    } else {
      console.error("Upload error:", result.error)
      alert(`Upload failed: ${result.error}`)
    }

    setLoading(false)
  }

  const handleEdit = (movie: Movie) => {
    setEditingMovie({
      ...movie,
      downloadEnabled: movie.downloadEnabled || false,
      downloadUrl: movie.downloadUrl || "",
      customVastUrl: movie.customVastUrl || "",
      useGlobalAd: movie.useGlobalAd ?? true,
      description: movie.description || "",
      thumbnail: movie.thumbnail || movie.posterUrl || "",
      videoLink: movie.videoLink || movie.videoUrl || "",
      year: movie.year || 2024,
      posterUrl: movie.posterUrl || "",
      videoUrl: movie.videoUrl || "",
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMovie) return

    setLoading(true)
    const result = await updateMovie(String(editingMovie.id), {
      title: editingMovie.title,
      description: editingMovie.description || "",
      year: editingMovie.year || 2024,
      genre: editingMovie.genre || "Action",
      posterUrl: editingMovie.thumbnail || editingMovie.posterUrl || "",
      videoUrl: editingMovie.videoLink || editingMovie.videoUrl || "",
      isFeatured: editingMovie.status === "Published",
      downloadEnabled: editingMovie.downloadEnabled || false,
      downloadUrl: editingMovie.downloadUrl || "",
      customVastUrl: editingMovie.customVastUrl || "",
      useGlobalAd: editingMovie.useGlobalAd ?? true,
    })

    if (result.success) {
      const moviesData = await getAdminMovies()
      setMovies(moviesData)
      setEditModalOpen(false)
      setEditingMovie(null)
    } else {
      alert(`Update failed: ${result.error}`)
    }

    setLoading(false)
  }

  const handleSaveAdSettings = async () => {
    setLoading(true)

    const result = await updateAdSettings({
      horizontalAdCode: adSettings.horizontalAdCode,
      verticalAdCode: adSettings.verticalAdCode,
      vastPrerollUrl: adSettings.vastUrl,
      adTimeout: adSettings.adTimeout,
      adsEnabled: adSettings.showPrerollAds || adSettings.showHomepageAds || adSettings.showMovieDetailAds,
      homepageEnabled: adSettings.showHomepageAds,
      movieDetailEnabled: adSettings.showMovieDetailAds,
    })

    if (result.success) {
      alert("Ad settings saved successfully!")
    } else {
      alert(`Failed to save ad settings: ${result.error}`)
    }

    setLoading(false)
  }

  const handleDelete = async (movieId: number) => {
    if (!confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    const result = await deleteMovie(String(movieId))

    if (result.success) {
      const moviesData = await getAdminMovies()
      setMovies(moviesData)
    } else {
      alert(`Delete failed: ${result.error}`)
    }

    setLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return
    }

    setLoading(true)
    const response = await fetch(`/api/admin/comments/${commentId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      const commentsResponse = await fetch("/api/admin/comments")
      const commentsData = await commentsResponse.json()
      setComments(commentsData)
    } else {
      alert("Failed to delete comment")
    }

    setLoading(false)
  }

  const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()))

  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                  <Lock className="w-12 h-12 text-[#00FFFF]" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-[#888888] text-sm">Enter your 4-digit PIN to continue</p>
            </div>

            {pinError && (
              <motion.div
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {pinError}
              </motion.div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 4-digit PIN"
                  disabled={pinLoading}
                  className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white text-center text-2xl tracking-widest placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading || pinInput.length !== 4}
                className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pinLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock Dashboard</span>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg">
              <p className="text-[#888888] text-xs text-center">
                PIN is stored in <code className="bg-white/10 px-1 rounded text-cyan-400">ADMIN_PIN</code> environment
                variable
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex flex-col lg:flex-row">
      {editModalOpen && editingMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1018] border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Movie</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setEditingMovie(null)
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Movie Title</label>
                <input
                  type="text"
                  value={editingMovie.title}
                  onChange={(e) => setEditingMovie({ ...editingMovie, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Genre</label>
                <select
                  value={editingMovie.genre}
                  onChange={(e) => setEditingMovie({ ...editingMovie, genre: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  <option value="Action">Action</option>
                  <option value="Drama">Drama</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Nollywood">Nollywood</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Thumbnail URL</label>
                <input
                  type="url"
                  value={editingMovie.thumbnail || editingMovie.posterUrl}
                  onChange={(e) => setEditingMovie({ ...editingMovie, thumbnail: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Video URL</label>
                <input
                  type="url"
                  value={editingMovie.videoLink || editingMovie.videoUrl}
                  onChange={(e) => setEditingMovie({ ...editingMovie, videoLink: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-white font-medium mb-2 text-sm">Description</label>
                <textarea
                  value={editingMovie.description || ""}
                  onChange={(e) => setEditingMovie({ ...editingMovie, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMovie.downloadEnabled || false}
                    onChange={(e) => setEditingMovie({ ...editingMovie, downloadEnabled: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  <span className="text-white text-sm">Enable Download</span>
                </label>
              </div>

              {editingMovie.downloadEnabled && (
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Download URL</label>
                  <input
                    type="url"
                    value={editingMovie.downloadUrl || ""}
                    onChange={(e) => setEditingMovie({ ...editingMovie, downloadUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMovie.useGlobalAd ?? true}
                    onChange={(e) => setEditingMovie({ ...editingMovie, useGlobalAd: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  <span className="text-white text-sm">Use Global Ad</span>
                </label>
              </div>

              {!editingMovie.useGlobalAd && (
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Custom VAST URL</label>
                  <input
                    type="url"
                    value={editingMovie.customVastUrl || ""}
                    onChange={(e) => setEditingMovie({ ...editingMovie, customVastUrl: e.target.value })}
                    placeholder="https://example.com/vast.xml"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setEditingMovie(null)
                }}
                className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-40" : "hidden lg:flex"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 heartbeat">
            moBix
          </h1>
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "movies", label: "Manage Movies", icon: Film },
            { id: "upload", label: "Upload Movie", icon: Upload },
            { id: "users", label: "Manage Users", icon: Users },
            { id: "comments", label: "Comment Moderation", icon: MessageSquare },
            { id: "ads", label: "Ad Management", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as AdminTab)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <SignOutButton signOutCallback={() => (window.location.href = "/")}>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="p-4 sm:p-8 space-y-8 pt-16 lg:pt-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-white/50">Real-time platform metrics and activity</p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all"
                  >
                    <p className="text-white/60 text-sm font-medium mb-2">{metric.label}</p>
                    <p className="text-3xl font-bold text-cyan-400 mb-2">{metric.value}</p>
                    <p className="text-xs text-green-400">{metric.change}</p>
                  </div>
                ))}
              </div>

              {/* Activity Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Trending Movies */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Top 5 Trending Movies</h2>
                  <div className="space-y-3">
                    {trendingMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <span className="text-white font-medium">{movie.title}</span>
                        <span className="text-cyan-400 text-sm font-bold">{movie.views}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Recent User Signups</h2>
                  <div className="space-y-3">
                    {recentSignups.map((signup) => (
                      <div
                        key={signup.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <span className="text-white font-medium text-sm">{signup.email}</span>
                        <span className="text-white/50 text-xs">{signup.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "movies" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Manage Movies</h1>
                <p className="text-white/50">View, edit, and delete movie content</p>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              {/* Movies Table */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Title</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Genre</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Upload Date</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Status</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Views</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovies.map((movie) => (
                        <tr key={movie.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="px-6 py-4 text-white font-medium">{movie.title}</td>
                          <td className="px-6 py-4 text-white/70">{movie.genre}</td>
                          <td className="px-6 py-4 text-white/70">{movie.uploadDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                movie.status === "Published"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {movie.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-cyan-400 font-bold">{movie.views}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleEdit(movie)}
                              className="p-2 bg-white/5 hover:bg-cyan-500/20 rounded-lg transition-all"
                              title="Edit Movie"
                            >
                              <Edit className="w-4 h-4 text-cyan-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(movie.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Delete Movie"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Upload New Movie</h1>
                <p className="text-white/50">Add a new movie to the platform</p>
              </div>

              <form
                onSubmit={handleUpload}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Movie Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="Enter movie title"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Thumbnail URL</label>
                      <input
                        type="url"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleFormChange}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Video Link</label>
                      <input
                        type="url"
                        name="videoLink"
                        value={formData.videoLink}
                        onChange={handleFormChange}
                        placeholder="https://example.com/video.mp4"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Genre</label>
                      <select
                        name="genre"
                        value={formData.genre}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                      >
                        <option value="Action">Action</option>
                        <option value="Drama">Drama</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Nollywood">Nollywood</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.downloadEnabled}
                          onChange={(e) => setFormData({ ...formData, downloadEnabled: e.target.checked })}
                          className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-white text-sm font-medium">Enable Download</span>
                      </label>

                      {formData.downloadEnabled && (
                        <input
                          type="url"
                          value={formData.downloadUrl}
                          onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                          placeholder="https://example.com/download.mp4"
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Release Date</label>
                      <input
                        type="date"
                        name="releaseDate"
                        value={formData.releaseDate}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Status</label>
                      <div className="flex gap-4">
                        {["draft", "published"].map((status) => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              value={status}
                              checked={formData.status === status}
                              onChange={handleFormChange}
                              className="w-4 h-4 accent-cyan-400"
                            />
                            <span className="text-white capitalize text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">Long Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Enter movie description..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.useGlobalAd}
                          onChange={(e) => setFormData({ ...formData, useGlobalAd: e.target.checked })}
                          className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-white text-sm font-medium">Use Global Ad</span>
                      </label>

                      {!formData.useGlobalAd && (
                        <div>
                          <label className="block text-white/70 text-xs mb-1">Custom VAST URL</label>
                          <input
                            type="url"
                            value={formData.customVastUrl}
                            onChange={(e) => setFormData({ ...formData, customVastUrl: e.target.value })}
                            placeholder="https://example.com/vast.xml"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Movie
                </button>
              </form>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Manage Users</h1>
                <p className="text-white/50">View and manage registered users</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              {/* Users Table */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Email</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Date Joined</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Role</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="px-6 py-4 text-white font-medium">{user.email}</td>
                          <td className="px-6 py-4 text-white/70">{user.dateJoined}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                user.role === "Admin"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Ban User"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              className="p-2 bg-white/5 hover:bg-yellow-500/20 rounded-lg transition-all"
                              title="Reset Password"
                            >
                              <X className="w-4 h-4 text-yellow-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Comment Moderation</h1>
                <p className="text-white/50">Review and manage user comments across all movies</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Movie</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">User</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Comment</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Rating</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Date</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map((comment) => (
                        <tr key={comment.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="px-6 py-4 text-white font-medium">{comment.movieTitle}</td>
                          <td className="px-6 py-4 text-white/70">{comment.userEmail}</td>
                          <td className="px-6 py-4 text-white/70 max-w-xs truncate">{comment.text}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: comment.rating }).map((_, i) => (
                                <span key={i} className="text-yellow-400">
                                  ★
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/70">{comment.createdAt}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Ad Management</h1>
                <p className="text-white/50">Configure Adsterra and other ad codes for the platform</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 space-y-6">
                <div>
                  <h3 className="text-white font-bold text-lg mb-4">Pre-roll Video Ads (VAST URL)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Adsterra VAST URL</label>
                      <input
                        type="url"
                        value={adSettings.vastUrl}
                        onChange={(e) => setAdSettings({ ...adSettings, vastUrl: e.target.value })}
                        placeholder="https://syndication.realsrv.com/splash.php?idzone=..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
                      />
                      <p className="text-white/40 text-xs mt-1">
                        Get your VAST URL from Adsterra's Video Ad campaign settings
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Ad Timeout (seconds)</label>
                        <input
                          type="number"
                          min="10"
                          max="30"
                          value={adSettings.adTimeout}
                          onChange={(e) => setAdSettings({ ...adSettings, adTimeout: Number.parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={adSettings.showPrerollAds}
                            onChange={(e) => setAdSettings({ ...adSettings, showPrerollAds: e.target.checked })}
                            className="w-4 h-4 accent-cyan-400"
                          />
                          <span className="text-white text-sm">Enable Pre-roll Ads</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-white font-bold text-lg mb-4">Native Ad Cards (Adsterra)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Horizontal Ad Code (Movie Carousels)</label>
                      <textarea
                        value={adSettings.horizontalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, horizontalAdCode: e.target.value })}
                        placeholder='<script type="text/javascript">...</script>'
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs resize-none"
                      />
                      <p className="text-white/40 text-xs mt-1">
                        Paste your Adsterra Native Banner ad code here. Ads will appear after every 2 movies.
                      </p>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Vertical Ad Code (Sidebars)</label>
                      <textarea
                        value={adSettings.verticalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, verticalAdCode: e.target.value })}
                        placeholder='<script type="text/javascript">...</script>'
                        rows={4}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs resize-none"
                      />
                      <p className="text-white/40 text-xs mt-1">
                        Paste your Adsterra vertical banner ad code here for movie detail sidebars.
                      </p>
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adSettings.showHomepageAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showHomepageAds: e.target.checked })}
                          className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-white text-sm">Show on Homepage</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adSettings.showMovieDetailAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showMovieDetailAds: e.target.checked })}
                          className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-white text-sm">Show on Movie Pages</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveAdSettings}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Ad Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
