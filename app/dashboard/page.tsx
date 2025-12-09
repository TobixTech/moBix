"use client"
import { useState, useEffect, useRef } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { User, Crown, Eye, Bookmark, LogOut, Edit2, ChevronRight, Clock, Heart, X, Video, Sparkles } from "lucide-react"
import { getUserDashboardData, updateUserProfile } from "@/lib/server-actions"
import { getCreatorStatus } from "@/lib/creator-actions"
import { SiteSettingsProvider } from "@/components/site-settings-provider"
import { toast } from "sonner"

export default function Dashboard() {
  return (
    <SiteSettingsProvider>
      <DashboardContent />
    </SiteSettingsProvider>
  )
}

function DashboardContent() {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ username: "", bio: "" })
  const [activeTab, setActiveTab] = useState<"overview" | "watchlist" | "history" | "settings">("overview")
  const [showProfileModal, setShowProfileModal] = useState(false)

  const [creatorStatus, setCreatorStatus] = useState<any>(null)
  const [creatorLoading, setCreatorLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchUserData()
      fetchCreatorStatus()
    } else if (isLoaded) {
      setLoading(false)
      setCreatorLoading(false)
    }
  }, [isLoaded, clerkUser])

  const fetchUserData = async () => {
    setLoading(true)
    const result = await getUserDashboardData()
    if (result.success) {
      setUserData(result)
      setEditForm({
        username: result.user?.username || "",
        bio: result.user?.bio || "",
      })
    }
    setLoading(false)
  }

  const fetchCreatorStatus = async () => {
    setCreatorLoading(true)
    const result = await getCreatorStatus()
    if (result.success) {
      setCreatorStatus(result)
    }
    setCreatorLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfileUpdate = async () => {
    const result = await updateUserProfile(editForm)
    if (result.success) {
      toast.success("Profile updated successfully")
      setIsEditing(false)
      fetchUserData()
    } else {
      toast.error(result.error || "Failed to update profile")
    }
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00FFFF]/20 border-t-[#00FFFF] rounded-full animate-spin" />
      </main>
    )
  }

  if (!clerkUser) {
    return (
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <User className="w-16 h-16 text-[#00FFFF] mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to view your dashboard</h1>
          <p className="text-white/60 mb-6">Access your watchlist, history, and account settings</p>
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
          >
            Sign In
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    )
  }

  const isPremium = userData?.user?.isPremium
  const stats = userData?.stats || { watchlistCount: 0, historyCount: 0, favoritesCount: 0, totalWatchTime: 0 }

  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />

      <div className="pt-20 md:pt-24 px-4 md:px-8">
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1A1B23] to-[#0B0C10] border border-[#2A2B33] rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${isPremium ? "border-[#FFD700]" : "border-[#00FFFF]"}`}
                >
                  <img
                    src={clerkUser.imageUrl || "/placeholder.svg?height=128&width=128&query=user avatar"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                {isPremium && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0B0C10] text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PREMIUM
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {userData?.user?.username ||
                    clerkUser.firstName ||
                    clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
                </h1>
                <p className="text-white/60 mb-4">{clerkUser.emailAddresses?.[0]?.emailAddress}</p>

                {userData?.user?.bio && <p className="text-white/70 text-sm mb-4 max-w-md">{userData.user.bio}</p>}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex-1 px-4 py-3 bg-[#2A2B33] text-white rounded-lg hover:bg-[#3A3B43] transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>

                  {!isPremium && (
                    <Link
                      href="/premium"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#FFD700]/30 transition"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Premium
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-[#0B0C10]/50 rounded-xl p-4 text-center">
                <Bookmark className="w-6 h-6 text-[#00FFFF] mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.watchlistCount}</p>
                <p className="text-white/50 text-sm">Watchlist</p>
              </div>
              <div className="bg-[#0B0C10]/50 rounded-xl p-4 text-center">
                <Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.historyCount}</p>
                <p className="text-white/50 text-sm">Watched</p>
              </div>
              <div className="bg-[#0B0C10]/50 rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.favoritesCount}</p>
                <p className="text-white/50 text-sm">Favorites</p>
              </div>
              <div className="bg-[#0B0C10]/50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{Math.round(stats.totalWatchTime / 60)}h</p>
                <p className="text-white/50 text-sm">Watch Time</p>
              </div>
            </div>
          </div>

          {/* Creator Card Section */}
          {!creatorLoading && creatorStatus && (
            <div className="bg-gradient-to-br from-purple-500/10 to-[#1A1B23] border border-purple-500/20 rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-[#00FFFF]/30 flex items-center justify-center">
                    <Video className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Creator Studio
                      {creatorStatus.isCreator && creatorStatus.status === "approved" && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      )}
                      {creatorStatus.status === "pending" && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Pending</span>
                      )}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {creatorStatus.isCreator && creatorStatus.status === "approved"
                        ? "Upload and manage your content"
                        : creatorStatus.status === "pending"
                          ? "Your request is being reviewed"
                          : creatorStatus.status === "rejected"
                            ? "Your request was not approved"
                            : creatorStatus.isEligible
                              ? "Share your movies and series with the community"
                              : `Account must be ${creatorStatus.minAgeDays}+ days old`}
                    </p>
                  </div>
                </div>

                {creatorStatus.isCreator && creatorStatus.status === "approved" ? (
                  <Link
                    href="/creator"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-[#00FFFF] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition"
                  >
                    <Sparkles className="w-5 h-5" />
                    Open Creator Studio
                  </Link>
                ) : creatorStatus.status === "pending" ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Clock className="w-5 h-5" />
                    Request Pending
                  </div>
                ) : (
                  <Link
                    href="/creator"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold rounded-lg hover:bg-purple-500/30 transition"
                  >
                    <Video className="w-5 h-5" />
                    {creatorStatus.isEligible ? "Become a Creator" : "Learn More"}
                  </Link>
                )}
              </div>

              {/* Progress bar for ineligible users */}
              {!creatorStatus.isCreator &&
                creatorStatus.status !== "pending" &&
                creatorStatus.accountAgeDays < creatorStatus.minAgeDays && (
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Account Age: {creatorStatus.accountAgeDays} days</span>
                      <span>Required: {creatorStatus.minAgeDays} days</span>
                    </div>
                    <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-[#00FFFF] transition-all"
                        style={{
                          width: `${Math.min(100, (creatorStatus.accountAgeDays / creatorStatus.minAgeDays) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link
              href="/watchlist"
              className="flex items-center justify-between p-4 bg-[#1A1B23] border border-[#2A2B33] rounded-xl hover:border-[#00FFFF]/30 transition group"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-[#00FFFF]" />
                <span className="text-white font-medium">My Watchlist</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#00FFFF] transition" />
            </Link>

            <Link
              href="/history"
              className="flex items-center justify-between p-4 bg-[#1A1B23] border border-[#2A2B33] rounded-xl hover:border-[#00FFFF]/30 transition group"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Watch History</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#00FFFF] transition" />
            </Link>
          </div>

          {/* Recent Activity */}
          {userData?.recentHistory && userData.recentHistory.length > 0 && (
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00FFFF]" />
                Continue Watching
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userData.recentHistory.slice(0, 4).map((item: any) => (
                  <Link
                    key={item.id}
                    href={item.type === "movie" ? `/movie/${item.contentId}` : `/series/${item.contentId}`}
                    className="group"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 relative">
                      <img
                        src={item.posterUrl || "/placeholder.svg?height=300&width=200&query=movie poster"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <span className="text-white text-sm font-medium">Continue</span>
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition mb-8"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF] resize-none"
                  rows={3}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 bg-[#2A2B33] text-white rounded-lg hover:bg-[#3A3B43] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="flex-1 px-4 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </main>
  )
}
