"use client"

import { useState, useEffect } from "react"
import { useUser, SignOutButton } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MovieCard from "@/components/movie-card"
import {
  User,
  Settings,
  LogOut,
  Heart,
  MessageSquare,
  Loader,
  Save,
  BookmarkIcon,
  PlayCircle,
  RefreshCw,
} from "lucide-react"
import { getUserStats, updateUserProfile, getContinueWatching, getAdSettings } from "@/lib/server-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"

type DashboardTab = "profile" | "watchlist" | "liked" | "continue" | "settings"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("profile")
  const { user: clerkUser, isLoaded } = useUser()
  const [userStats, setUserStats] = useState<any>(null)
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const [adSettings, setAdSettings] = useState<any>(null)

  const fetchUserData = async () => {
    if (clerkUser) {
      setFirstName(clerkUser.firstName || "")
      setLastName(clerkUser.lastName || "")
      setUsername(clerkUser.username || "")
    }

    const [statsResult, continueResult, adSettingsResult] = await Promise.all([
      getUserStats(),
      getContinueWatching(),
      getAdSettings(),
    ])

    if (statsResult.success) {
      setUserStats(statsResult.stats)
    }
    setContinueWatching(continueResult || [])
    setAdSettings(adSettingsResult)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (isLoaded) {
      fetchUserData()
    }
  }, [isLoaded, clerkUser])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUserData()
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const result = await updateUserProfile({
        username,
        firstName,
        lastName,
      })

      if (result.success) {
        setSaveMessage("Profile updated successfully!")
        setTimeout(() => setSaveMessage(""), 3000)
        router.refresh()
      } else {
        setSaveMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setSaveMessage("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const DashboardAdBanner = ({ className = "" }: { className?: string }) => {
    if (!adSettings?.dashboardEnabled || !adSettings?.horizontalAdCode) return null

    return (
      <div className={`bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden ${className}`}>
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { margin: 0; padding: 8px; display: flex; align-items: center; justify-content: center; background: transparent; }
              </style>
            </head>
            <body>${adSettings.horizontalAdCode}</body>
            </html>
          `}
          className="w-full min-h-[90px]"
          style={{ border: "none" }}
          scrolling="no"
          title="Advertisement"
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        <DashboardAdBanner className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold">Dashboard</h3>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-[#00FFFF] hover:bg-[#2A2B33] rounded transition"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "profile" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={() => setActiveTab("watchlist")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "watchlist" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <BookmarkIcon className="w-4 h-4" />
                  Watchlist
                  {userStats?.totalWatchlist > 0 && (
                    <span className="ml-auto bg-[#00FFFF]/20 text-[#00FFFF] text-xs px-2 py-0.5 rounded">
                      {userStats.totalWatchlist}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("liked")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "liked" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Liked Movies
                  {userStats?.totalLikes > 0 && (
                    <span className="ml-auto bg-[#00FFFF]/20 text-[#00FFFF] text-xs px-2 py-0.5 rounded">
                      {userStats.totalLikes}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("continue")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "continue" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  Continue Watching
                  {continueWatching.length > 0 && (
                    <span className="ml-auto bg-[#00FFFF]/20 text-[#00FFFF] text-xs px-2 py-0.5 rounded">
                      {continueWatching.length}
                    </span>
                  )}
                </button>
              </nav>

              <div className="border-t border-[#2A2B33] mt-6 pt-6 space-y-2">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "settings" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <SignOutButton>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-[#888888] hover:text-white hover:bg-[#2A2B33] rounded transition">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>

                {loading ? (
                  <div className="flex items-center justify-center text-white py-8">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-[#00FFFF]/20 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-[#00FFFF]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {clerkUser?.firstName || "User"} {clerkUser?.lastName || ""}
                        </h3>
                        <p className="text-[#888888]">
                          {userStats?.email || clerkUser?.emailAddresses?.[0]?.emailAddress}
                        </p>
                        <p className="text-[#888888] text-sm mt-2">
                          Member since{" "}
                          {userStats?.memberSince ? new Date(userStats.memberSince).toLocaleDateString() : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
                        <Heart className="w-8 h-8 text-[#00FFFF] mb-2" />
                        <p className="text-2xl font-bold text-white">{userStats?.totalLikes || 0}</p>
                        <p className="text-[#888888] text-sm">Movies Liked</p>
                      </div>
                      <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
                        <MessageSquare className="w-8 h-8 text-[#00FFFF] mb-2" />
                        <p className="text-2xl font-bold text-white">{userStats?.totalComments || 0}</p>
                        <p className="text-[#888888] text-sm">Comments Posted</p>
                      </div>
                      <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
                        <BookmarkIcon className="w-8 h-8 text-[#00FFFF] mb-2" />
                        <p className="text-2xl font-bold text-white">{userStats?.totalWatchlist || 0}</p>
                        <p className="text-[#888888] text-sm">In Watchlist</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Email (Cannot be changed)</label>
                        <input
                          type="email"
                          value={userStats?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || ""}
                          readOnly
                          className="w-full px-4 py-2 bg-[#0B0C10]/50 border border-[#2A2B33] rounded text-[#888888] cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                        {saveMessage && (
                          <span className={saveMessage.includes("Error") ? "text-red-400" : "text-green-400"}>
                            {saveMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "watchlist" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">My Watchlist</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A2B33] text-white rounded hover:bg-[#3A3B43] transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center text-white py-8">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : userStats?.watchlistMovies && userStats.watchlistMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userStats.watchlistMovies.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 text-center">
                    <BookmarkIcon className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h3>
                    <p className="text-[#888888] mb-4">Start adding movies to watch later!</p>
                    <Link
                      href="/home"
                      className="inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                    >
                      Browse Movies
                    </Link>
                  </div>
                )}

                {userStats?.watchlistMovies && userStats.watchlistMovies.length > 0 && (
                  <DashboardAdBanner className="mt-6" />
                )}
              </div>
            )}

            {activeTab === "liked" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Liked Movies</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A2B33] text-white rounded hover:bg-[#3A3B43] transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center text-white py-8">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : userStats?.likedMovies && userStats.likedMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userStats.likedMovies.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 text-center">
                    <Heart className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No liked movies yet</h3>
                    <p className="text-[#888888] mb-4">Start exploring and like movies you enjoy!</p>
                    <Link
                      href="/home"
                      className="inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                    >
                      Browse Movies
                    </Link>
                  </div>
                )}

                {userStats?.likedMovies && userStats.likedMovies.length > 0 && <DashboardAdBanner className="mt-6" />}
              </div>
            )}

            {activeTab === "continue" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A2B33] text-white rounded hover:bg-[#3A3B43] transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center text-white py-8">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : continueWatching.length > 0 ? (
                  <div className="space-y-4">
                    {continueWatching.map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/movie/${item.id}`}
                        className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 flex gap-4 hover:border-[#00FFFF]/50 transition block"
                      >
                        <img
                          src={item.posterUrl || "/placeholder.svg?height=100&width=180&query=movie poster"}
                          alt={item.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-bold mb-2">{item.title}</h4>
                          <div className="w-full bg-[#0B0C10] rounded-full h-2 mb-2">
                            <div
                              className="bg-[#00FFFF] h-2 rounded-full transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <p className="text-[#888888] text-sm">{item.progress}% watched</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 text-center">
                    <PlayCircle className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nothing to continue</h3>
                    <p className="text-[#888888] mb-4">Start watching a movie and your progress will be saved here!</p>
                    <Link
                      href="/home"
                      className="inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                    >
                      Browse Movies
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Email notifications for new movies</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#00FFFF]" defaultChecked />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Email notifications for replies to comments</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#00FFFF]" defaultChecked />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2B33] pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Playback</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Autoplay next episode</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#00FFFF]" defaultChecked />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Default video quality</span>
                        <select className="bg-[#0B0C10] border border-[#2A2B33] rounded px-3 py-1 text-white">
                          <option value="auto">Auto</option>
                          <option value="1080p">1080p</option>
                          <option value="720p">720p</option>
                          <option value="480p">480p</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2B33] pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Show my watch history</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#00FFFF]" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-[#888888]">Show my liked movies publicly</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#00FFFF]" />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2B33] pt-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                    <button className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DashboardAdBanner className="mt-8" />
      </div>

      <Footer />
    </main>
  )
}
