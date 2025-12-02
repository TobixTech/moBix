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
  Ban,
  Inbox,
  CheckCircle,
  RefreshCw,
  Plus,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  getAdminMetrics,
  getTrendingMovies,
  getRecentSignups,
  getAdminMovies,
  getUsers, // Added getUsers import
  uploadMovie,
  updateMovie,
  deleteMovie,
  getAdSettings,
  updateAdSettings,
  deleteComment,
  banUser,
  deleteUser,
  getFeedbackEntries, // Added import
  updateFeedbackStatus, // Added import
  deleteFeedback, // Added import
  getAllComments,
} from "@/lib/server-actions"

// Import necessary shadcn/ui dialog components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type AdminTab = "overview" | "movies" | "upload" | "users" | "comments" | "ads" | "feedback"

interface Metric {
  label: string
  value: string
  change: string
}

// ... existing interfaces ...
interface Movie {
  id: number
  title: string
  views?: string
  genre?: string
  uploadDate?: string
  status?: string
  downloadEnabled?: boolean
  downloadUrl?: string
  customVastUrl?: string
  useGlobalAd?: boolean
  description?: string
  thumbnail?: string
  videoUrl?: string
  year?: number
  posterUrl?: string
  videoLink?: string // Added for edit modal compatibility
}

interface Signup {
  id: number
  email: string
  date: string
}

interface User {
  id: string
  email: string
  dateJoined: string
  role: string
  createdAt?: string // Added for getUsers response
  commentsCount?: number // Added for users tab
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

interface Feedback {
  id: string
  type: string
  title: string
  details: string
  email: string
  status: string
  createdAt: Date
}

export default function AdminDashboard() {
  const [pinVerified, setPinVerified] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinLoading, setPinLoading] = useState(false)

  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const handleAdminLogout = async () => {
    // Use a simple API route for admin logout, assuming it exists
    await fetch("/api/auth/admin-logout", { method: "POST" })
    window.location.href = "/" // Redirect to home or login page
  }

  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [movieSearch, setMovieSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [metrics, setMetrics] = useState<Metric[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [recentSignups, setRecentSignups] = useState<Signup[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [users, setUsers] = useState<User[]>([]) // Changed type to User[] to match potential getUsers response structure, assuming it aligns or is compatible with AdminUser. If not, 'any[]' would be a fallback.
  const [comments, setComments] = useState<Comment[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([]) // Added feedback state
  const [loading, setLoading] = useState(true)

  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // ... existing state ...
  // FIND THE adSettings STATE AROUND LINE 143-165 AND UPDATE IT
  const [adSettings, setAdSettings] = useState({
    horizontalAdCode: "",
    verticalAdCode: "",
    prerollAdCodes: [] as { code: string; name: string }[],
    smartLinkUrl: "",
    adTimeout: 20,
    skipDelay: 10, // Added skipDelay
    rotationInterval: 5, // Added rotationInterval
    showPrerollAds: true,
    showHomepageAds: true,
    showMovieDetailAds: true,
    showDashboardAds: true, // Added showDashboardAds
  })

  const [newAdCode, setNewAdCode] = useState({
    code: "",
    name: "",
  })

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

  // ... existing handlePinSubmit ...
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
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh && pinVerified) {
      interval = setInterval(() => {
        fetchDashboardData()
        setLastRefresh(new Date())
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, pinVerified])

  // Refactor fetch to a named function
  const fetchDashboardData = async () => {
    try {
      const [
        metricsData,
        trendingData,
        signupsData,
        moviesData,
        usersData,
        commentsData,
        adSettingsData,
        feedbackData,
      ] = await Promise.all([
        getAdminMetrics(),
        getTrendingMovies(),
        getRecentSignups(),
        getAdminMovies(),
        getUsers(),
        getAllComments(),
        getAdSettings(),
        getFeedbackEntries(),
      ])

      setMetrics(metricsData)
      setTrendingMovies(trendingData)
      setRecentSignups(signupsData)
      setMovies(moviesData)
      setUsers(usersData)
      setComments(commentsData)
      setFeedback(feedbackData)

      if (adSettingsData) {
        setAdSettings({
          horizontalAdCode: adSettingsData.horizontalAdCode || "",
          verticalAdCode: adSettingsData.verticalAdCode || "",
          // Parse prerollAdCodes from string to array
          prerollAdCodes: adSettingsData.prerollAdCodes ? JSON.parse(adSettingsData.prerollAdCodes) : [],
          smartLinkUrl: adSettingsData.smartLinkUrl || "",
          adTimeout: adSettingsData.adTimeoutSeconds || 20,
          skipDelay: adSettingsData.skipDelaySeconds || 10, // Added skipDelay
          rotationInterval: adSettingsData.rotationIntervalSeconds || 5, // Added rotationInterval
          showPrerollAds: adSettingsData.showPrerollAds ?? true,
          showHomepageAds: adSettingsData.homepageEnabled ?? true,
          showMovieDetailAds: adSettingsData.movieDetailEnabled ?? true,
          showDashboardAds: adSettingsData.dashboardEnabled ?? true, // Added showDashboardAds from API response
        })
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pinVerified) {
      fetchDashboardData()
    }
  }, [pinVerified])

  // ... existing handlers (handleFormChange, handleUpload, handleEdit, handleSaveEdit, handleSaveAdSettings, handleDelete, handleDeleteComment, handleBanUser, handleDeleteUser) ...
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
      title: movie.title || "",
      description: movie.description || "",
      year: movie.year || 2024,
      genre: movie.genre || "Action",
      posterUrl: movie.posterUrl || "",
      videoUrl: movie.videoUrl || "",
      videoLink: movie.videoUrl || "", // Ensure videoLink is populated for the form
      thumbnail: movie.posterUrl || "", // Ensure thumbnail is populated for the form
      downloadEnabled: movie.downloadEnabled || false,
      downloadUrl: movie.downloadUrl || "",
      customVastUrl: movie.customVastUrl || "",
      useGlobalAd: movie.useGlobalAd ?? true,
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

  // FIND THE NEW ADD BANNER AD STATE AND UPDATE IT
  const handleAddBannerAd = () => {
    if (!newAdCode.code) {
      alert("Please enter an ad code")
      return
    }
    setAdSettings({
      ...adSettings,
      prerollAdCodes: [...adSettings.prerollAdCodes, { ...newAdCode }],
    })
    setNewAdCode({ code: "", name: "" })
  }

  const handleRemoveBannerAd = (index: number) => {
    setAdSettings({
      ...adSettings,
      prerollAdCodes: adSettings.prerollAdCodes.filter((_, i) => i !== index),
    })
  }

  const handleSaveAdSettings = async () => {
    setLoading(true)

    const result = await updateAdSettings({
      horizontalAdCode: adSettings.horizontalAdCode,
      verticalAdCode: adSettings.verticalAdCode,
      prerollAdCodes: JSON.stringify(adSettings.prerollAdCodes),
      smartLinkUrl: adSettings.smartLinkUrl,
      adTimeoutSeconds: adSettings.adTimeout,
      skipDelaySeconds: adSettings.skipDelay,
      rotationIntervalSeconds: adSettings.rotationInterval,
      showPrerollAds: adSettings.showPrerollAds,
      homepageEnabled: adSettings.showHomepageAds,
      movieDetailEnabled: adSettings.showMovieDetailAds,
      dashboardEnabled: adSettings.showDashboardAds, // Added dashboardEnabled
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
    const result = await deleteComment(commentId)

    if (result.success) {
      // Re-fetch comments to update the list
      const commentsData = await getAllComments()
      setComments(commentsData)
      alert("Comment deleted successfully!")
    } else {
      alert(`Failed to delete comment: ${result.error}`)
    }

    setLoading(false)
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user?")) {
      return
    }

    setLoading(true)
    const result = await banUser(userId)

    if (result.success) {
      const usersData = await getUsers() // Using getUsers
      setUsers(usersData)
      alert("User banned successfully!")
    } else {
      alert(`Failed to ban user: ${result.error}`)
    }

    setLoading(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    const result = await deleteUser(userId)

    if (result.success) {
      const usersData = await getUsers() // Using getUsers
      setUsers(usersData)
      alert("User deleted successfully!")
    } else {
      alert(`Failed to delete user: ${result.error}`)
    }

    setLoading(false)
  }

  const handleUpdateFeedback = async (id: string, status: string) => {
    setLoading(true)
    const result = await updateFeedbackStatus(id, status)
    if (result.success) {
      const feedbackData = await getFeedbackEntries()
      setFeedback(feedbackData)
    } else {
      alert("Failed to update status")
    }
    setLoading(false)
  }

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Delete this entry permanently?")) return
    setLoading(true)
    const result = await deleteFeedback(id)
    if (result.success) {
      const feedbackData = await getFeedbackEntries()
      setFeedback(feedbackData)
    } else {
      alert("Failed to delete entry")
    }
    setLoading(false)
  }

  const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()))

  // ... existing PIN verification render ...
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
                  className="w-full px-4 py-2 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white text-center text-2xl tracking-widest placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all disabled:opacity-50"
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
      {/* ... Edit Modal ... */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1A1B23] border border-[#00FFFF]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#00FFFF]">Edit Movie</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Title</label>
              <input
                type="text"
                value={editingMovie?.title || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Year</label>
              <input
                type="number"
                value={editingMovie?.year || 2024}
                onChange={(e) => setEditingMovie({ ...editingMovie!, year: Number.parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Genre</label>
              <select
                value={editingMovie?.genre || "Action"}
                onChange={(e) => setEditingMovie({ ...editingMovie!, genre: e.target.value })}
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
              <label className="block text-white font-medium mb-2 text-sm">Status</label>
              <select
                value={editingMovie?.status || "Published"}
                onChange={(e) => setEditingMovie({ ...editingMovie!, status: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Poster URL (Thumbnail)</label>
              <input
                type="url"
                value={editingMovie?.thumbnail || editingMovie?.posterUrl || ""}
                onChange={(e) =>
                  setEditingMovie({ ...editingMovie!, thumbnail: e.target.value, posterUrl: e.target.value })
                }
                placeholder="https://example.com/movie-poster.jpg"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Video URL (Embedded Link)</label>
              <input
                type="url"
                value={editingMovie?.videoLink || editingMovie?.videoUrl || ""}
                onChange={(e) =>
                  setEditingMovie({ ...editingMovie!, videoLink: e.target.value, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/embed/... or direct video URL"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-download"
                checked={editingMovie?.downloadEnabled || false}
                onChange={(e) => setEditingMovie({ ...editingMovie!, downloadEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="edit-download" className="text-white text-sm">
                Enable Download
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Download URL</label>
              <input
                type="url"
                value={editingMovie?.downloadUrl || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, downloadUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                disabled={!editingMovie?.downloadEnabled}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Custom VAST URL (Optional)</label>
              <input
                type="url"
                value={editingMovie?.customVastUrl || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, customVastUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-global-ad"
                checked={editingMovie?.useGlobalAd ?? true}
                onChange={(e) => setEditingMovie({ ...editingMovie!, useGlobalAd: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="edit-global-ad" className="text-white text-sm">
                Use Global Ad Settings
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Description</label>
              <textarea
                value={editingMovie?.description || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
            { id: "feedback", label: "Feedback & Requests", icon: Inbox },
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
          {/* Update the logout button to call the logout API */}
          {/* Removed SignOutButton from Clerk */}
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white/70 hover:text-white">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-xl font-bold text-white capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab.replace("-", " ")}
            </h2>
          </div>
          {/* Add refresh controls to the header area after the sidebar */}
          {/* Find the main content area and add this after the tabs */}
          {/* Refresh Controls - Add this after the tab buttons */}
          <div className="flex items-center gap-4 ml-auto">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#00FFFF]"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => {
                setLoading(true)
                fetchDashboardData()
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2B33] text-white rounded hover:bg-[#3A3B43] transition text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="text-xs text-gray-500">Last: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </header>

        <div className="p-6">
          {/* ... other tabs content ... */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Feedback & Requests</h3>
              <div className="grid gap-4">
                {feedback.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No feedback or requests found.</p>
                ) : (
                  feedback.map((entry) => (
                    <div key={entry.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                entry.type === "REQUEST"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {entry.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                entry.status === "PENDING"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-green-500/10 text-green-400 border-green-500/20"
                              }`}
                            >
                              {entry.status}
                            </span>
                            <span className="text-white/40 text-xs">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white">{entry.title}</h4>
                          {entry.email && <p className="text-cyan-400 text-sm">From: {entry.email}</p>}
                        </div>
                        <div className="flex gap-2">
                          {entry.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateFeedback(entry.id, "COMPLETE")}
                              className="p-2 hover:bg-green-500/10 text-white/50 hover:text-green-400 rounded-lg transition-colors"
                              title="Mark as Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFeedback(entry.id)}
                            className="p-2 hover:bg-red-500/10 text-white/50 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          {activeTab === "overview" && adSettings.showDashboardAds && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-cyan-500/30 transition-all group"
                  >
                    <h3 className="text-white/50 text-sm font-medium mb-2">{metric.label}</h3>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {metric.value}
                      </div>
                      <div className="text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                        {metric.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Movies */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Film className="w-5 h-5 text-cyan-400" />
                    Trending Now
                  </h3>
                  <div className="space-y-4">
                    {trendingMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-12 h-16 bg-white/10 rounded-lg overflow-hidden relative">
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl || "/placeholder.svg"}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                              No Img
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                            {movie.title}
                          </h4>
                          <p className="text-white/40 text-sm">{movie.genre}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{movie.views}</div>
                          <div className="text-white/30 text-xs">views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Recent Signups
                  </h3>
                  <div className="space-y-4">
                    {recentSignups.map((signup) => (
                      <div
                        key={signup.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {signup.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{signup.email}</h4>
                          <p className="text-white/40 text-sm">Joined {signup.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "movies" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <Search className="w-5 h-5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload New
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Movie</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Genre</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Views</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredMovies.map((movie) => (
                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{movie.title}</div>
                          </td>
                          <td className="px-6 py-4 text-white/70">{movie.genre}</td>
                          <td className="px-6 py-4 text-white/50">{movie.uploadDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                movie.status === "Published"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }`}
                            >
                              {movie.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-mono">{movie.views}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(movie)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-cyan-400 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(movie.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-8">Upload New Movie</h3>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Movie Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="Enter movie title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Genre</label>
                      <select
                        name="genre"
                        value={formData.genre}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="Action">Action</option>
                        <option value="Drama">Drama</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Nollywood">Nollywood</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Release Date</label>
                      <input
                        type="date"
                        name="releaseDate"
                        value={formData.releaseDate}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      placeholder="Enter movie description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail URL</label>
                      <input
                        type="url"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="https://..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Video Link (Embed/Direct)</label>
                      <input
                        type="url"
                        name="videoLink"
                        value={formData.videoLink}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>

                  {/* Added Download & Ad Settings to Upload Form */}
                  <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-4">
                    <h4 className="font-medium text-white">Additional Options</h4>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="downloadEnabled"
                        checked={formData.downloadEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, downloadEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="downloadEnabled" className="text-white text-sm">
                        Enable Download
                      </label>
                    </div>

                    {formData.downloadEnabled && (
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Download URL</label>
                        <input
                          type="url"
                          name="downloadUrl"
                          value={formData.downloadUrl}
                          onChange={handleFormChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Custom VAST URL (Optional)</label>
                      <input
                        type="url"
                        name="customVastUrl"
                        value={formData.customVastUrl}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="Override global ad setting"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="useGlobalAd"
                        checked={formData.useGlobalAd}
                        onChange={(e) => setFormData((prev) => ({ ...prev, useGlobalAd: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="useGlobalAd" className="text-white text-sm">
                        Use Global Ad Settings
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() =>
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
                      }
                      className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-all"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? "Uploading..." : "Upload Movie"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <Search className="w-5 h-5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Comments</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Joined</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                {user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-white">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                user.role === "ADMIN" // Role check changed to 'ADMIN' for case-insensitivity if necessary, or matching API response. Assuming 'ADMIN' is the correct constant.
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-white/10 text-white/60 border-white/10"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/70">{user.commentsCount || 0}</td>
                          <td className="px-6 py-4 text-white/50">{user.createdAt || user.dateJoined}</td>{" "}
                          {/* Prefer createdAt if available, otherwise fall back to dateJoined */}
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-yellow-400 transition-colors"
                                title="Ban User"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
              <h3 className="text-2xl font-bold text-white mb-6">Recent Comments</h3>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white/50" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{comment.userEmail}</div>
                          <div className="text-white/40 text-sm">on {comment.movieTitle}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold flex items-center gap-1">★ {comment.rating}</span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-2 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/80 leading-relaxed">{comment.text}</p>
                    <div className="mt-4 text-white/30 text-xs">{comment.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-cyan-400" />
                  Ad Configuration
                </h3>

                <div className="space-y-6">
                  {/* Pre-roll Banner Ads Section */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Pre-roll Ads</h4>
                    <p className="text-white/60 text-sm mb-4">
                      Add pre-roll ad codes. They will rotate based on the interval below.
                    </p>

                    {/* Existing Pre-roll Ads */}
                    {adSettings.prerollAdCodes.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {adSettings.prerollAdCodes.map((ad, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{ad.name || `Ad ${index + 1}`}</p>
                              <p className="text-white/40 text-xs truncate">{ad.code.substring(0, 50)}...</p>
                            </div>
                            <button
                              onClick={() => handleRemoveBannerAd(index)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Pre-roll Ad */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Name (optional)</label>
                        <input
                          type="text"
                          value={newAdCode.name}
                          onChange={(e) => setNewAdCode({ ...newAdCode, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. Google AdSense Unit 1"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Code *</label>
                        <textarea
                          rows={3}
                          value={newAdCode.code}
                          onChange={(e) => setNewAdCode({ ...newAdCode, code: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="Paste your HTML or JS ad code here"
                        />
                      </div>
                      <button
                        onClick={handleAddBannerAd}
                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Ad Code
                      </button>
                    </div>
                  </div>

                  {/* Ad Timing Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Ad Duration (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.adTimeout}
                        onChange={(e) => setAdSettings({ ...adSettings, adTimeout: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="10"
                        max="60"
                      />
                      <p className="text-white/40 text-xs mt-1">Auto-skip after this time</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Skip Delay (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.skipDelay}
                        onChange={(e) => setAdSettings({ ...adSettings, skipDelay: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="5"
                        max="30"
                      />
                      <p className="text-white/40 text-xs mt-1">Skip button appears after</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Rotation Interval (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.rotationInterval}
                        onChange={(e) => setAdSettings({ ...adSettings, rotationInterval: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="3"
                        max="15"
                      />
                      <p className="text-white/40 text-xs mt-1">Change ad every</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Smart Link URL</label>
                    <input
                      type="url"
                      value={adSettings.smartLinkUrl}
                      onChange={(e) => setAdSettings({ ...adSettings, smartLinkUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                      placeholder="https://..."
                    />
                    <p className="text-white/40 text-sm mt-2">
                      Direct link for popunders/smart links on download buttons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Horizontal Ad Code (Fallback)</label>
                      <textarea
                        value={adSettings.horizontalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, horizontalAdCode: e.target.value })}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                        placeholder="<!-- HTML/JS Code -->"
                      />
                      <p className="text-white/40 text-xs mt-1">Used if no banner images added</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Vertical Ad Code</label>
                      <textarea
                        value={adSettings.verticalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, verticalAdCode: e.target.value })}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                        placeholder="<!-- HTML/JS Code -->"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSaveAdSettings}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
