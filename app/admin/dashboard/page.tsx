"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LogOut, LayoutDashboard, Film, Upload, Users, Settings, Search, Filter, Edit, Trash2, Eye, RotateCcw, Menu, X, MessageSquare } from 'lucide-react'
import { useAuth, SignOutButton } from "@clerk/nextjs"
import {
  getAdminMetrics,
  getTrendingMovies,
  getRecentSignups,
  getAdminMovies,
  getAdminUsers,
  uploadMovie,
  updateMovie,
  deleteMovie,
  saveAdSettings,
} from "@/lib/server-actions"

type AdminTab = "overview" | "movies" | "upload" | "users" | "ads" | "comments"

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

  const [formData, setFormData] = useState({
    title: "",
    thumbnail: "",
    videoLink: "",
    description: "",
    genre: "Action",
    releaseDate: "",
    status: "draft",
  })

  const [adSettings, setAdSettings] = useState({
    horizontalAdCode: "",
    verticalAdCode: "",
    homepageEnabled: true,
    movieDetailEnabled: true,
    dashboardEnabled: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, trendingData, signupsData, moviesData, usersData] = await Promise.all([
          getAdminMetrics(),
          getTrendingMovies(),
          getRecentSignups(),
          getAdminMovies(),
          getAdminUsers(),
        ])
        setMetrics(metricsData)
        setTrendingMovies(trendingData)
        setRecentSignups(signupsData)
        setMovies(moviesData)
        setUsers(usersData)
        
        const commentsResponse = await fetch("/api/admin/comments")
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
      year: parseInt(formData.releaseDate.split("-")[0]),
      genre: formData.genre,
      posterUrl: formData.thumbnail,
      videoUrl: formData.videoLink,
      isFeatured: formData.status === "published",
    })

    if (result.success) {
      // Reset form
      setFormData({
        title: "",
        thumbnail: "",
        videoLink: "",
        description: "",
        genre: "Action",
        releaseDate: "",
        status: "draft",
      })
      
      // Refresh movies list
      const moviesData = await getAdminMovies()
      setMovies(moviesData)
      
      // Switch to movies tab to see the result
      setActiveTab("movies")
    } else {
      console.error("Upload error:", result.error)
      alert(`Upload failed: ${result.error}`)
    }
    
    setLoading(false)
  }

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie)
    setEditModalOpen(true)
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

  const handleSaveEdit = async () => {
    if (!editingMovie) return

    setLoading(true)
    const result = await updateMovie(String(editingMovie.id), {
      title: editingMovie.title,
      description: "",
      year: 2024,
      genre: editingMovie.genre || "Action",
      posterUrl: "",
      videoUrl: "",
      isFeatured: editingMovie.status === "Published",
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

  const handleSaveAdSettings = async () => {
    setLoading(true)
    const result = await saveAdSettings(adSettings)
    
    if (result.success) {
      alert("Ad settings saved successfully!")
    } else {
      alert(`Failed to save ad settings: ${result.error}`)
    }
    
    setLoading(false)
  }

  const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()))

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
          <div className="bg-[#0F1018] border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            
            <div className="space-y-4">
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
                </select>
              </div>
              
              <div className="flex gap-4 pt-4">
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
            { id: "ads", label: "Ad Settings", icon: Settings },
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
                      </select>
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
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
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
                              <Eye className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              className="p-2 bg-white/5 hover:bg-yellow-500/20 rounded-lg transition-all"
                              title="Reset Password"
                            >
                              <RotateCcw className="w-4 h-4 text-yellow-400" />
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
                                <span key={i} className="text-yellow-400">★</span>
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
                <h1 className="text-4xl font-bold text-white mb-2">Ad Settings</h1>
                <p className="text-white/50">Manage ad placements and codes</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 space-y-8">
                {/* Horizontal Ad */}
                <div>
                  <label className="block text-white font-bold mb-3 text-sm">Horizontal Ad Code (728x90)</label>
                  <textarea
                    value={adSettings.horizontalAdCode}
                    onChange={(e) => setAdSettings({ ...adSettings, horizontalAdCode: e.target.value })}
                    placeholder="Paste your AdSense code here..."
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-mono text-xs"
                  />
                </div>

                {/* Vertical Ad */}
                <div>
                  <label className="block text-white font-bold mb-3 text-sm">Vertical Ad Code (300x250)</label>
                  <textarea
                    value={adSettings.verticalAdCode}
                    onChange={(e) => setAdSettings({ ...adSettings, verticalAdCode: e.target.value })}
                    placeholder="Paste your AdSense code here..."
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-mono text-xs"
                  />
                </div>

                {/* Ad Placements */}
                <div>
                  <label className="block text-white font-bold mb-4 text-sm">Ad Placements</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={adSettings.homepageEnabled}
                        onChange={(e) => setAdSettings({ ...adSettings, homepageEnabled: e.target.checked })}
                        className="w-4 h-4 accent-cyan-400 rounded"
                      />
                      <span className="text-white font-medium text-sm">Homepage Carousel</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={adSettings.movieDetailEnabled}
                        onChange={(e) => setAdSettings({ ...adSettings, movieDetailEnabled: e.target.checked })}
                        className="w-4 h-4 accent-cyan-400 rounded"
                      />
                      <span className="text-white font-medium text-sm">Movie Detail Page</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={adSettings.dashboardEnabled}
                        onChange={(e) => setAdSettings({ ...adSettings, dashboardEnabled: e.target.checked })}
                        className="w-4 h-4 accent-cyan-400 rounded"
                      />
                      <span className="text-white font-medium text-sm">Dashboard</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveAdSettings}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Save Ad Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
