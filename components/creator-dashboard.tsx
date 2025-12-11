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
  Edit,
  Plus,
  Trash2,
  BookOpen,
  Save,
  X,
} from "lucide-react"
import { getCreatorDashboardData, getCreatorNotifications, updateSubmission } from "@/lib/creator-actions"
import { CreatorUploadForm } from "@/components/creator-upload-form"
import { CreatorNotificationBell } from "@/components/creator-notification-bell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CreatorDashboardProps {
  profile: any
  onRefresh: () => void
}

type CreatorTab = "upload" | "content" | "analytics" | "earnings"

function CreatorRules({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-500" />
            Creator Guidelines & Rules
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-zinc-300">
          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">1. Content Standards</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>All uploaded content must be original or you must have proper licensing rights</li>
              <li>No copyrighted material without explicit permission from the owner</li>
              <li>Content must not contain illegal activities or promote harmful behavior</li>
              <li>No explicit adult content, violence, or graphic material</li>
              <li>Content must be properly categorized with accurate genre and descriptions</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">2. Upload Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Video files must be in supported formats: MP4, WebM, MKV, AVI, or MOV</li>
              <li>Maximum file size: 1GB per video</li>
              <li>Thumbnails should be high quality and accurately represent the content</li>
              <li>Titles and descriptions must be accurate and not misleading</li>
              <li>All required fields must be filled out completely</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">3. Prohibited Content</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Spam, duplicate, or low-quality content</li>
              <li>Content that infringes on intellectual property rights</li>
              <li>Hate speech, discrimination, or harassment</li>
              <li>Misleading thumbnails or clickbait titles</li>
              <li>Content promoting scams, fraud, or illegal activities</li>
              <li>Malware, viruses, or any harmful software</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">4. Strike System</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <span className="text-yellow-500 font-medium">1 Strike:</span> Warning - Content removed, creator
                notified
              </li>
              <li>
                <span className="text-orange-500 font-medium">2 Strikes:</span> Temporary suspension - 7 day upload
                restriction
              </li>
              <li>
                <span className="text-red-500 font-medium">3 Strikes:</span> Account suspension - Creator privileges
                revoked
              </li>
              <li>Strikes can be appealed within 30 days through the dashboard</li>
              <li>Strikes expire after 90 days of good standing</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">5. Best Practices</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Engage respectfully with your audience and respond to feedback</li>
              <li>Maintain consistent upload quality and schedule</li>
              <li>Use accurate tags and categories to help viewers find your content</li>
              <li>Report any issues or bugs through proper channels</li>
              <li>Keep your account information up to date</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-cyan-500 mb-3">6. Revenue & Monetization</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Earnings are calculated based on verified views and engagement</li>
              <li>Minimum payout threshold applies before withdrawal</li>
              <li>Fraudulent activity will result in immediate account termination</li>
              <li>Revenue share is subject to platform terms and conditions</li>
            </ul>
          </section>

          <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-400">
              By uploading content to MoBix, you agree to abide by these guidelines. Violation of these rules may result
              in content removal, strikes, or account suspension. For questions or appeals, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditSubmissionModal({
  submission,
  onClose,
  onSave,
}: {
  submission: any
  onClose: () => void
  onSave: () => void
}) {
  const [title, setTitle] = useState(submission.title || "")
  const [description, setDescription] = useState(submission.description || "")
  const [genre, setGenre] = useState(submission.genre || "")
  const [year, setYear] = useState(submission.year?.toString() || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    setSaving(true)
    try {
      const result = await updateSubmission(submission.id, {
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        year: year ? Number.parseInt(year) : undefined,
      })

      if (result.success) {
        toast.success("Submission updated successfully")
        onSave()
        onClose()
      } else {
        toast.error(result.error || "Failed to update submission")
      }
    } catch (error) {
      toast.error("Failed to update submission")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Submission</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={4}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Genre</label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Action"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Year</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500">
              Note: Video and thumbnail URLs cannot be edited. If you need to change the media files, please delete this
              submission and create a new one.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-300 bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
            {saving ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CreatorDashboard({ profile, onRefresh }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<CreatorTab>("upload")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [contentFilter, setContentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "deleted">("all")
  const [editingSubmission, setEditingSubmission] = useState<any>(null)
  const [showRules, setShowRules] = useState(false)
  const [editModalSubmission, setEditModalSubmission] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [dashResult, notifResult] = await Promise.all([getCreatorDashboardData(), getCreatorNotifications()])

      console.log("[v0] Dashboard data:", dashResult)
      console.log("[v0] Notifications:", notifResult)

      if (dashResult.success) {
        setDashboardData(dashResult)
      }
      if (notifResult.success) {
        setNotifications(notifResult.notifications || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
    }
    setLoading(false)
    setRefreshing(false)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleEditSeries = (submission: any) => {
    setEditingSubmission(submission)
    setActiveTab("upload")
  }

  const handleCancelEdit = () => {
    setEditingSubmission(null)
  }

  const tabs = [
    { id: "upload", label: editingSubmission ? "Edit Series" : "Upload", icon: editingSubmission ? Edit : Upload },
    { id: "content", label: "My Content", icon: Film },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: DollarSign },
  ]

  const filteredSubmissions =
    dashboardData?.submissions?.filter((s: any) => {
      if (contentFilter === "all") return true
      if (contentFilter === "deleted") return s.isDeleted
      if (s.isDeleted) return false
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
    <div className="pt-24 px-4 md:px-8 pb-24">
      {showRules && <CreatorRules onClose={() => setShowRules(false)} />}

      {editModalSubmission && (
        <EditSubmissionModal
          submission={editModalSubmission}
          onClose={() => setEditModalSubmission(null)}
          onSave={fetchDashboardData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Creator Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {profile.displayName || "Creator"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRules(true)}
            className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Creator Rules</span>
            <span className="sm:hidden">Rules</span>
          </Button>
          <CreatorNotificationBell notifications={notifications} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-400 ${refreshing ? "animate-spin" : ""}`} />
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
            onClick={() => {
              if (tab.id !== "upload") setEditingSubmission(null)
              setActiveTab(tab.id as CreatorTab)
            }}
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
            uploadsToday: dashboardData?.dailyTracking?.uploadsToday || 0,
            storageUsedToday: Number(dashboardData?.dailyTracking?.storageUsedToday) || 0,
            uploadLimit: dashboardData?.dailyTracking?.uploadLimit || 4,
            storageLimit: Number(dashboardData?.dailyTracking?.storageLimit) || 8,
          }}
          onUploadComplete={() => {
            handleRefresh()
            setEditingSubmission(null)
          }}
          editingSubmission={editingSubmission}
          onCancelEdit={handleCancelEdit}
        />
      )}

      {/* My Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["all", "pending", "approved", "rejected", "deleted"].map((filter) => (
              <button
                key={filter}
                onClick={() => setContentFilter(filter as any)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition whitespace-nowrap ${
                  contentFilter === filter
                    ? filter === "deleted"
                      ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      : "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30"
                    : "bg-[#0B0C10] text-white/70 hover:bg-[#2A2B33]"
                }`}
              >
                {filter}{" "}
                {filter !== "all" && (
                  <span className="ml-1">
                    (
                    {filter === "deleted"
                      ? dashboardData?.stats?.deletedCount || 0
                      : dashboardData?.stats?.[`${filter}Count`] || 0}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSubmissions.map((submission: any) => (
              <div
                key={submission.id}
                className={`bg-zinc-800/50 rounded-lg overflow-hidden border transition-all ${
                  submission.isDeleted ? "border-red-500/30 opacity-60" : "border-zinc-700/50 hover:border-zinc-600"
                }`}
              >
                <div className="aspect-video relative">
                  {submission.isDeleted && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                      <div className="text-center">
                        <Trash2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">Content Deleted</p>
                      </div>
                    </div>
                  )}
                  <img
                    src={submission.thumbnailUrl || "/placeholder.svg?height=180&width=320"}
                    alt={submission.title}
                    className={`w-full h-full object-cover ${submission.isDeleted ? "grayscale" : ""}`}
                  />
                  <div className="absolute top-2 left-2 z-20">
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
                  <div className="absolute top-2 right-2 z-20">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                        submission.isDeleted
                          ? "bg-gray-500/20 text-gray-400"
                          : submission.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : submission.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {submission.isDeleted && <Trash2 className="w-3 h-3" />}
                      {!submission.isDeleted && submission.status === "approved" && <CheckCircle className="w-3 h-3" />}
                      {!submission.isDeleted && submission.status === "rejected" && <XCircle className="w-3 h-3" />}
                      {!submission.isDeleted && submission.status === "pending" && <Clock className="w-3 h-3" />}
                      {submission.isDeleted ? "deleted" : submission.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold truncate ${submission.isDeleted ? "text-gray-400" : "text-white"}`}>
                    {submission.title}
                  </h3>
                  <p className="text-white/50 text-sm mb-3">{submission.genre}</p>

                  {submission.isDeleted ? (
                    <div className="p-2 bg-gray-500/10 border border-gray-500/20 rounded text-xs text-gray-400">
                      This content has been removed by an administrator and is no longer available on the platform.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-white/60">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {submission.viewsCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {submission.likesCount || 0}
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
                    </>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 mt-3">
                    {/* Edit button - only for pending/approved non-deleted */}
                    {!submission.isDeleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditModalSubmission(submission)}
                        className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}

                    {/* Add Episodes button for series */}
                    {submission.type === "series" && !submission.isDeleted && submission.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSeries(submission)}
                        className="flex-1 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Episodes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4 md:p-6">
          <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                Total Watch Time
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (Number(a.watchTime) || 0), 0) || 0}{" "}
                min
              </p>
            </div>
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Eye className="w-4 h-4" />
                Views (30 days)
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (Number(a.views) || 0), 0) || 0}
              </p>
            </div>
            <div className="bg-[#0B0C10] border border-[#2A2B33] rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Heart className="w-4 h-4" />
                Likes (30 days)
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData?.analytics?.reduce((sum: number, a: any) => sum + (Number(a.likes) || 0), 0) || 0}
              </p>
            </div>
          </div>

          {/* Top Performing Content */}
          <h3 className="text-white font-bold mb-4">Top Performing Content</h3>
          {dashboardData?.submissions?.length > 0 ? (
            <div className="space-y-3">
              {[...dashboardData.submissions]
                .sort((a: any, b: any) => (b.viewsCount || 0) - (a.viewsCount || 0))
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
                      <p className="text-white font-bold">{submission.viewsCount || 0}</p>
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
