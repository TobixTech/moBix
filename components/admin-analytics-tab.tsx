"use client"

import { useState, useEffect } from "react"
import { Eye, Users, Film, Tv, TrendingUp, Heart, MessageSquare, Clock, RefreshCw } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface AnalyticsData {
  totalViews: number
  totalUsers: number
  totalMovies: number
  totalSeries: number
  totalLikes: number
  totalComments: number
  totalWatches: number
  newUsersWeek: number
  newUsersMonth: number
  trendingMovies: Array<{
    id: string
    title: string
    posterUrl: string
    views: number
  }>
  trendingSeries: Array<{
    id: string
    title: string
    posterUrl: string
    views: number
  }>
  recentSignups: Array<{
    id: string
    email: string
    username: string | null
    createdAt: string
  }>
}

export function AdminAnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics")
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.analytics)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to fetch analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Analytics Dashboard</h3>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-white/50 text-sm">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <span className="text-white/70 text-sm">Total Views</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics?.totalViews?.toLocaleString() || "0"}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white/70 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics?.totalUsers?.toLocaleString() || "0"}</p>
          <p className="text-green-400 text-xs mt-1">+{analytics?.newUsersWeek || 0} this week</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-5 h-5 text-green-400" />
            <span className="text-white/70 text-sm">Total Movies</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics?.totalMovies?.toLocaleString() || "0"}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-5 h-5 text-orange-400" />
            <span className="text-white/70 text-sm">Total Series</span>
          </div>
          <p className="text-3xl font-bold text-white">{analytics?.totalSeries?.toLocaleString() || "0"}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-white/70 text-sm">Total Likes</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalLikes || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-white/70 text-sm">Total Comments</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalComments || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-white/70 text-sm">Watch Sessions</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalWatches || 0}</p>
        </div>
      </div>

      {/* Trending Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Trending Movies
          </h4>
          <div className="space-y-3">
            {analytics?.trendingMovies?.map((movie, index) => (
              <div key={movie.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl font-bold text-white/30 w-8">#{index + 1}</span>
                <Image
                  src={movie.posterUrl || "/placeholder.svg?height=60&width=40"}
                  alt={movie.title}
                  width={40}
                  height={60}
                  className="rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{movie.title}</p>
                  <p className="text-white/50 text-sm">{movie.views?.toLocaleString() || 0} views</p>
                </div>
              </div>
            ))}
            {(!analytics?.trendingMovies || analytics.trendingMovies.length === 0) && (
              <p className="text-white/50 text-center py-4">No movies yet</p>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Trending Series
          </h4>
          <div className="space-y-3">
            {analytics?.trendingSeries?.map((show, index) => (
              <div key={show.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                <span className="text-2xl font-bold text-white/30 w-8">#{index + 1}</span>
                <Image
                  src={show.posterUrl || "/placeholder.svg?height=60&width=40"}
                  alt={show.title}
                  width={40}
                  height={60}
                  className="rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{show.title}</p>
                  <p className="text-white/50 text-sm">{show.views?.toLocaleString() || 0} views</p>
                </div>
              </div>
            ))}
            {(!analytics?.trendingSeries || analytics.trendingSeries.length === 0) && (
              <p className="text-white/50 text-center py-4">No series yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Recent Signups
        </h4>
        <div className="space-y-2">
          {analytics?.recentSignups?.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-medium">{user.username || user.email}</p>
                <p className="text-white/50 text-sm">{user.email}</p>
              </div>
              <span className="text-white/50 text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {(!analytics?.recentSignups || analytics.recentSignups.length === 0) && (
            <p className="text-white/50 text-center py-4">No recent signups</p>
          )}
        </div>
      </div>
    </div>
  )
}
