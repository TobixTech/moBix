"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MovieCard from "@/components/movie-card"
import AdBanner from "@/components/ad-banner"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import {
  User,
  Settings,
  Heart,
  MessageSquare,
  Loader,
  BookmarkIcon,
  PlayCircle,
  RefreshCw,
  Globe,
  Crown,
  Sparkles,
} from "lucide-react"
import { getUserStats, updateUserProfile, getContinueWatching } from "@/lib/server-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"

type DashboardTab = "profile" | "watchlist" | "liked" | "continue" | "settings"

export default function DashboardPage() {
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

  const isPremium = userStats?.role === "PREMIUM"

  const fetchUserData = async () => {
    if (clerkUser) {
      setFirstName(clerkUser.firstName || "")
      setLastName(clerkUser.lastName || "")
      setUsername(clerkUser.username || "")
    }

    const [statsResult, continueResult, adSettingsResponse] = await Promise.all([
      getUserStats(),
      getContinueWatching(),
      fetch("/api/ad-settings", { cache: "no-store" })
        .then((res) => res.json())
        .catch(() => null),
    ])

    if (statsResult.success) {
      setUserStats(statsResult.stats)
    }
    setContinueWatching(continueResult || [])
    setAdSettings(adSettingsResponse)
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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "continue", label: "Continue Watching", icon: Globe },
    { id: "watchlist", label: "Watchlist", icon: BookmarkIcon },
    { id: "liked", label: "Liked", icon: Heart },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        {isPremium && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-amber-400 font-bold flex items-center gap-2">
                Premium Member <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-amber-200/70 text-sm">Enjoy ad-free streaming and exclusive features</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg text-white hover:bg-[#2A2B33] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-[#00FFFF] text-[#0B0C10] font-medium"
                  : "bg-[#1A1B23] text-white hover:bg-[#2A2B33]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
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
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center relative ${
                      isPremium
                        ? "bg-gradient-to-br from-amber-400/30 to-yellow-600/30 border-2 border-amber-500"
                        : "bg-[#00FFFF]/20"
                    }`}
                  >
                    {isPremium && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <User className={`w-12 h-12 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {clerkUser?.firstName || "User"} {clerkUser?.lastName || ""}
                      {isPremium && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold rounded-full">
                          PREMIUM
                        </span>
                      )}
                    </h3>
                    <p className="text-[#888888]">{userStats?.email || clerkUser?.emailAddresses?.[0]?.emailAddress}</p>
                    {(clerkUser?.unsafeMetadata?.country || userStats?.country) && (
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="w-4 h-4 text-[#00FFFF]" />
                        <span className="text-[#888888] text-sm">
                          {(clerkUser?.unsafeMetadata?.country as string) || userStats?.country}
                        </span>
                      </div>
                    )}
                    <p className="text-[#888888] text-sm mt-2">
                      Member since{" "}
                      {userStats?.memberSince ? new Date(userStats.memberSince).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div
                    className={`border rounded-lg p-4 ${isPremium ? "bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/30" : "bg-[#0B0C10] border-[#2A2B33]"}`}
                  >
                    <Heart className={`w-8 h-8 mb-2 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
                    <p className="text-2xl font-bold text-white">{userStats?.totalLikes || 0}</p>
                    <p className="text-[#888888] text-sm">Movies Liked</p>
                  </div>
                  <div
                    className={`border rounded-lg p-4 ${isPremium ? "bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/30" : "bg-[#0B0C10] border-[#2A2B33]"}`}
                  >
                    <MessageSquare className={`w-8 h-8 mb-2 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
                    <p className="text-2xl font-bold text-white">{userStats?.totalComments || 0}</p>
                    <p className="text-[#888888] text-sm">Comments Posted</p>
                  </div>
                  <div
                    className={`border rounded-lg p-4 ${isPremium ? "bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/30" : "bg-[#0B0C10] border-[#2A2B33]"}`}
                  >
                    <BookmarkIcon className={`w-8 h-8 mb-2 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
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

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Country (Cannot be changed)</label>
                    <div className="w-full px-4 py-2 bg-[#0B0C10]/50 border border-[#2A2B33] rounded text-[#888888] cursor-not-allowed flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {(clerkUser?.unsafeMetadata?.country as string) || userStats?.country || "Not set"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={`px-6 py-2 font-bold rounded-lg transition disabled:opacity-50 ${
                        isPremium
                          ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:shadow-lg hover:shadow-amber-500/30"
                          : "bg-[#00FFFF] text-[#0B0C10] hover:shadow-lg hover:shadow-[#00FFFF]/50"
                      }`}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    {saveMessage && (
                      <p className={saveMessage.includes("Error") ? "text-red-400" : "text-green-400"}>{saveMessage}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Continue Watching Tab */}
        {activeTab === "continue" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-[#00FFFF]" />
              Continue Watching
            </h2>
            {loading ? (
              <div className="flex items-center justify-center text-white py-8">
                <Loader className="w-6 h-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : continueWatching.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                <p className="text-[#888888]">No movies in progress</p>
                <Link
                  href="/home"
                  className="mt-4 inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Browse Movies
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {continueWatching.map((item: any) => (
                  <Link key={item.movieId} href={`/movie/${item.movie?.slug || item.movieId}`}>
                    <div className="relative group cursor-pointer">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#2A2B33]">
                        <img
                          src={item.movie?.posterUrl || "/placeholder.svg?height=300&width=200"}
                          alt={item.movie?.title || "Movie"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <PlayCircle className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div
                          className="h-full bg-[#00FFFF]"
                          style={{
                            width: `${item.duration > 0 ? (item.progress / item.duration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-white text-sm font-medium truncate">{item.movie?.title}</p>
                      <p className="text-[#888888] text-xs">
                        {Math.floor(item.progress / 60)}m / {Math.floor(item.duration / 60)}m
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">My Watchlist</h2>
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
              <div className="text-center py-12">
                <BookmarkIcon className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                <p className="text-[#888888]">Your watchlist is empty</p>
                <Link
                  href="/home"
                  className="mt-4 inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Browse Movies
                </Link>
              </div>
            )}

            {userStats?.watchlistMovies && userStats.watchlistMovies.length > 0 && (
              <AdBanner type="horizontal" placement="dashboard" />
            )}
          </div>
        )}

        {/* Liked Tab */}
        {activeTab === "liked" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Liked Movies</h2>
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
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
                <p className="text-[#888888]">No liked movies yet</p>
                <Link
                  href="/home"
                  className="mt-4 inline-block px-6 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Browse Movies
                </Link>
              </div>
            )}

            {userStats?.likedMovies && userStats.likedMovies.length > 0 && (
              <AdBanner type="horizontal" placement="dashboard" />
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#0B0C10] border border-[#2A2B33] rounded-lg">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-[#888888] text-sm">Receive email updates about new movies</p>
                </div>
                <button className="w-12 h-6 bg-[#00FFFF] rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0B0C10] border border-[#2A2B33] rounded-lg">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-[#888888] text-sm">Get notified when new movies are added</p>
                </div>
                <button className="w-12 h-6 bg-[#2A2B33] rounded-full relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ad Banner - only show if user is not premium */}
        {!isPremium && adSettings?.dashboardEnabled && (
          <div className="mt-6">
            <AdBanner type="horizontal" placement="dashboard" />
          </div>
        )}
      </div>

      <MobileBottomNav />
      <Footer />
    </main>
  )
}
