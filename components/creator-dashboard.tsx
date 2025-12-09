"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  Film,
  Tv,
  BarChart3,
  DollarSign,
  Eye,
  Heart,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { getCreatorDashboardData, getCreatorNotifications } from "@/lib/creator-actions"
import { CreatorUploadForm } from "@/components/creator-upload-form"
import { CreatorNotificationBell } from "@/components/creator-notification-bell"

interface CreatorDashboardProps {
  profile: any
  onRefresh: () => void
}

type CreatorTab = "upload" | "content" | "analytics" | "earnings"

export function CreatorDashboard({ profile, onRefresh }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<CreatorTab>("upload")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [contentFilter, setContentFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    const [dashResult, notifResult] = await Promise.all([getCreatorDashboardData(), getCreatorNotifications()])

    if (dashResult.success) {
      setDashboardData(dashResult)
    }
    if (notifResult.success) {
      setNotifications(notifResult.notifications || [])
    }
    setLoading(false)
    setRefreshing(false)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const tabs = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "content", label: "My Content", icon: Film },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: DollarSign },
  ]

  const filteredSubmissions =
    dashboardData?.submissions?.filter((s: any) => {
      if (contentFilter === "all") return true
      return s.status === contentFilter
    }) || []

  if (loading) {
    return (
      <div className="pt-24 px-4 md:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-[#00FFFF] animate-spin" />
          <p className="text-white/70">Loading Creator Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 px-4 md:px-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            Creator Studio
            {profile?.status === "suspended" && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">Suspended</span>
            )}
          </h1>
          <p className="text-white/60 mt-1">Manage your content and track performance</p>
        </div>
        <div className="flex items-center gap-3">
          <CreatorNotificationBell notifications={notifications} onRefresh={fetchDashboardData} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg text-white hover:bg-[#2A2B33] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-5 h-5 text-[#00FFFF]" />
            <span className="text-white/60 text-sm">Total Uploads</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.totalUploads || 0}</p>
        </div>
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-white/60 text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.totalViews || 0}</p>
        </div>
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="text-white/60 text-sm">Total Likes</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.totalLikes || 0}</p>
        </div>
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-white/60 text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.pendingCount || 0}</p>
        </div>
      </div>

      {/* Daily Limits */}
      <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4 mb-8">
        <h3 className="text-white font-bold mb-4">Daily Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Uploads Today</span>
              <span className="text-white">
                {dashboardData?.dailyTracking?.uploadsToday || 0} / {dashboardData?.dailyTracking?.uploadLimit || 4}
              </span>
            </div>
            <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00FFFF] transition-all"
                style={{
                  width: `${Math.min(100, ((dashboardData?.dailyTracking?.uploadsToday || 0) / (dashboardData?.dailyTracking?.uploadLimit || 4)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Storage Used Today</span>
              <span className="text-white">
                {(dashboardData?.dailyTracking?.storageUsedToday || 0).toFixed(2)} GB /{" "}
                {dashboardData?.dailyTracking?.storageLimit || 8} GB
              </span>
            </div>
            <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, ((dashboardData?.dailyTracking?.storageUsedToday || 0) / (dashboardData?.dailyTracking?.storageLimit || 8)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CreatorTab)}
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

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <CreatorUploadForm
          dailyTracking={{
            uploadsToday: profile?.uploadsToday || 0,
            storageUsedToday: Number(profile?.storageUsedToday) || 0,
            uploadLimit: profile?.dailyUploadLimit || 4,
            storageLimit: Number(profile?.dailyStorageLimitGb) || 8,
          }}
          onUploadComplete={handleRefresh}
        />
      )}

      {/* My Content Tab */}
      {activeTab === "content" && (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">My Content</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {["all", "pending", "approved", "rejected"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setContentFilter(filter as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                    contentFilter === filter
                      ? "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30"
                      : "bg-[#0B0C10] text-white/70 hover:bg-[#2A2B33]"
                  }`}
                >
                  {filter} {filter !== "all" && `(${dashboardData?.stats?.[`${filter}Count`] || 0})`}
                </button>
              ))}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
              <p className="text-white/60">No content found</p>
              {contentFilter === "all" && (
                <button
                  onClick={() => setActiveTab("upload")}
                  className="mt-4 px-6 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                >
                  Upload Your First Content
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmissions.map((submission: any) => (
                <div key={submission.id} className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={submission.thumbnailUrl || "/placeholder.svg?height=180&width=320"}
                      alt={submission.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          submission.type === "movie"
                            ? "bg-[#00FFFF]/20 text-[#00FFFF]"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {submission.type === "movie" ? (
                          <Film className="w-3 h-3 inline mr-1" />
                        ) : (
                          <Tv className="w-3 h-3 inline mr-1" />
                        )}
                        {submission.type}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                          submission.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : submission.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {submission.status === "approved" && <CheckCircle className="w-3 h-3" />}
                        {submission.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {submission.status === "pending" && <Clock className="w-3 h-3" />}
                        {submission.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold truncate">{submission.title}</h3>
                    <p className="text-white/50 text-sm mb-3">{submission.genre}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-white/60">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {submission.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {submission.likesCount}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {submission.status === "rejected" && submission.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                        Reason: {submission.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                Total Watch Time
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (a.watchTime || 0), 0) || 0} min
              </p>
            </div>
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Eye className="w-4 h-4" />
                Views (30 days)
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (a.views || 0), 0) || 0}
              </p>
            </div>
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Heart className="w-4 h-4" />
                Likes (30 days)
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (a.likes || 0), 0) || 0}
              </p>
            </div>
          </div>

          {/* Top Performing Content */}
          <h3 className="text-white font-bold mb-4">Top Performing Content</h3>
          {dashboardData?.submissions?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.submissions
                .sort((a: any, b: any) => b.viewsCount - a.viewsCount)
                .slice(0, 5)
                .map((submission: any, index: number) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 p-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg"
                  >
                    <span className="text-[#00FFFF] font-bold text-lg w-6">{index + 1}</span>
                    <img
                      src={submission.thumbnailUrl || "/placeholder.svg?height=48&width=80"}
                      alt={submission.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{submission.title}</p>
                      <p className="text-white/50 text-sm">{submission.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{submission.viewsCount}</p>
                      <p className="text-white/50 text-xs">views</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              No content yet. Upload your first video to see analytics!
            </div>
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === "earnings" && (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FFFF]/20 to-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-[#00FFFF]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon!</h2>
            <p className="text-white/60 max-w-md mx-auto">
              Revenue sharing feature launching soon. Stay tuned for updates on how you can earn from your content!
            </p>
          </div>
        </div>
      )}

      {/* Strike Warning */}
      {dashboardData?.stats?.strikeCount > 0 && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-bold">Account Warning</h3>
            <p className="text-red-200/70 text-sm">
              You have {dashboardData.stats.strikeCount} strike(s) on your account.
              {dashboardData.stats.strikeCount >= 2 && " One more strike may result in suspension."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
