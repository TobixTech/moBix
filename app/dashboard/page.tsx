"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MovieCard from "@/components/movie-card"
import { User, Settings, LogOut, Heart, MessageSquare } from "lucide-react"
import { getUserStats } from "@/lib/server-actions"

type DashboardTab = "profile" | "watchlist" | "liked" | "continue"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("profile")
  const { user: clerkUser } = useUser()
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      const result = await getUserStats()
      if (result.success) {
        setUserStats(result.stats)
      }
      setLoading(false)
    }
    fetchUserData()
  }, [])

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 sticky top-24">
              <h3 className="text-white font-bold mb-6">Dashboard</h3>

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
                  <span>📋</span>
                  Watchlist
                </button>

                <button
                  onClick={() => setActiveTab("liked")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "liked" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <span>❤️</span>
                  Liked Movies
                </button>

                <button
                  onClick={() => setActiveTab("continue")}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded transition ${
                    activeTab === "continue" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white hover:bg-[#2A2B33]"
                  }`}
                >
                  <span>▶️</span>
                  Continue Watching
                </button>
              </nav>

              <div className="border-t border-[#2A2B33] mt-6 pt-6 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-white hover:bg-[#2A2B33] rounded transition">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-[#888888] hover:text-white hover:bg-[#2A2B33] rounded transition">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>

                {loading ? (
                  <div className="text-center text-white py-8">Loading...</div>
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

                    <div className="grid grid-cols-2 gap-4 mb-6">
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
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                        <input
                          type="text"
                          defaultValue={clerkUser?.firstName + " " + clerkUser?.lastName || "User"}
                          className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          defaultValue={userStats?.email || clerkUser?.emailAddresses?.[0]?.emailAddress}
                          className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white focus:outline-none focus:border-[#00FFFF]"
                        />
                      </div>
                      <button className="px-6 py-2 bg-[#00FFFF] text-[#0B0C10] rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition">
                        Save Changes
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "watchlist" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My Watchlist</h2>
                <MovieCard title="" />
              </div>
            )}

            {activeTab === "liked" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Liked Movies</h2>
                {loading ? (
                  <div className="text-center text-white py-8">Loading...</div>
                ) : userStats?.likedMovies && userStats.likedMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userStats.likedMovies.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#888888] py-8">No liked movies yet. Start exploring!</div>
                )}
              </div>
            )}

            {activeTab === "continue" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-4 flex gap-4">
                      <img
                        src={`/generic-movie-poster.png?height=100&width=180&query=movie poster ${i}`}
                        alt="Movie"
                        className="w-32 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-bold mb-2">Movie Title {i}</h4>
                        <div className="w-full bg-[#0B0C10] rounded-full h-2 mb-2">
                          <div className="bg-[#00FFFF] h-2 rounded-full" style={{ width: `${30 + i * 20}%` }} />
                        </div>
                        <p className="text-[#888888] text-sm">{30 + i * 20}% watched</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
