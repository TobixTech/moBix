"use client"

import { useState, useEffect } from "react"
import { Film, Tv, Clock, CheckCircle, XCircle, Eye, Search, Loader, Play, ImageIcon } from "lucide-react"
import {
  getContentSubmissions,
  approveSubmission,
  rejectSubmission,
  getCreatorStats,
} from "@/lib/admin-creator-actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SubTab = "pending" | "all"

export function AdminContentSubmissionsTab() {
  const [subTab, setSubTab] = useState<SubTab>("pending")
  const [submissions, setSubmissions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [subTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [submissionsRes, statsRes] = await Promise.all([
        getContentSubmissions(subTab === "pending" ? "pending" : undefined),
        getCreatorStats(),
      ])

      if (submissionsRes.success) setSubmissions(submissionsRes.submissions || [])
      if (statsRes.success) setStats(statsRes.stats)
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast.error("Failed to load submissions")
    }
    setLoading(false)
  }

  const handleApprove = async (submissionId: string) => {
    setLoadingItems((prev) => new Set(prev).add(submissionId))

    try {
      console.log("[v0] Approving submission:", submissionId)
      const result = await approveSubmission(submissionId, "admin")
      console.log("[v0] Approve result:", result)

      if (result.success) {
        toast.success("Content approved and published!")
        fetchData()
      } else {
        toast.error(result.error || "Failed to approve")
      }
    } catch (error) {
      console.error("[v0] Approve error:", error)
      toast.error("An error occurred while approving")
    }

    setLoadingItems((prev) => {
      const next = new Set(prev)
      next.delete(submissionId)
      return next
    })
  }

  const handleReject = async () => {
    if (!selectedSubmission || !rejectReason) return

    setLoadingItems((prev) => new Set(prev).add(selectedSubmission.id))

    try {
      const result = await rejectSubmission(selectedSubmission.id, "admin", rejectReason)

      if (result.success) {
        toast.success("Content rejected")
        setShowRejectModal(false)
        setRejectReason("")
        setSelectedSubmission(null)
        fetchData()
      } else {
        toast.error(result.error || "Failed to reject")
      }
    } catch (error) {
      console.error("[v0] Reject error:", error)
      toast.error("An error occurred while rejecting")
    }

    setLoadingItems((prev) => {
      const next = new Set(prev)
      next.delete(selectedSubmission.id)
      return next
    })
  }

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return

    setBulkLoading(true)
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const id of selectedItems) {
      try {
        console.log("[v0] Bulk approving:", id)
        const result = await approveSubmission(id, "admin")
        if (result.success) {
          successCount++
        } else {
          failCount++
          errors.push(result.error || "Unknown error")
        }
      } catch (error) {
        console.error("[v0] Bulk approve error for", id, error)
        failCount++
      }
    }

    setBulkLoading(false)

    if (successCount > 0) {
      toast.success(`Approved ${successCount} submission${successCount > 1 ? "s" : ""}`)
    }
    if (failCount > 0) {
      toast.error(
        `Failed to approve ${failCount} submission${failCount > 1 ? "s" : ""}: ${errors[0] || "Unknown error"}`,
      )
    }

    setSelectedItems(new Set())
    fetchData()
  }

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.creator?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || s.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Film className="w-4 h-4" />
            Total Submissions
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalSubmissions || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Review
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingSubmissions || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Approved Today
          </div>
          <p className="text-2xl font-bold text-green-400">{stats?.approvedToday || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Eye className="w-4 h-4 text-purple-400" />
            Total Views
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {submissions.reduce((sum, s) => sum + (s.viewsCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            subTab === "pending" ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setSubTab("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            subTab === "all" ? "bg-[#00FFFF] text-[#0B0C10]" : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          All Submissions
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by title or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00FFFF]/50"
          />
        </div>
        {subTab === "all" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00FFFF]/50"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && subTab === "pending" && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg">
          <span className="text-white font-medium">{selectedItems.size} selected</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            {bulkLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve All Selected
          </button>
          <button onClick={() => setSelectedItems(new Set())} className="text-white/70 hover:text-white transition">
            Clear Selection
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-[#00FFFF] animate-spin" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No submissions found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => {
            const isLoading = loadingItems.has(submission.id)

            return (
              <div
                key={submission.id}
                className={`bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4 ${isLoading ? "opacity-70" : ""}`}
              >
                {/* Checkbox for pending items */}
                {subTab === "pending" && (
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(submission.id)}
                      onChange={() => toggleSelectItem(submission.id)}
                      disabled={isLoading}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#00FFFF] focus:ring-[#00FFFF]/50"
                    />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {submission.thumbnailUrl ? (
                    <img
                      src={submission.thumbnailUrl || "/placeholder.svg"}
                      alt={submission.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                    {submission.type === "movie" ? (
                      <Film className="w-3 h-3 inline mr-1" />
                    ) : (
                      <Tv className="w-3 h-3 inline mr-1" />
                    )}
                    {submission.type}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold truncate">{submission.title}</h3>
                  <p className="text-white/60 text-sm truncate">{submission.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/50">
                    <span className="px-2 py-0.5 bg-white/10 rounded">{submission.genre}</span>
                    <span>by {submission.creator?.email || "Unknown"}</span>
                    <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      submission.status === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : submission.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission)
                      setShowPreviewModal(true)
                    }}
                    disabled={isLoading}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
                    title="Preview"
                  >
                    <Play className="w-4 h-4 text-white" />
                  </button>
                  {submission.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(submission.id)}
                        disabled={isLoading}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition disabled:opacity-50 flex items-center justify-center min-w-[36px]"
                        title="Approve & Publish"
                      >
                        {isLoading ? (
                          <Loader className="w-4 h-4 text-green-400 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setShowRejectModal(true)
                        }}
                        disabled={isLoading}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-[#1A1B23] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-white/60 text-sm">
              Rejecting: <strong className="text-white">{selectedSubmission?.title}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00FFFF]/50 min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason("")
                  setSelectedSubmission(null)
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || loadingItems.has(selectedSubmission?.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loadingItems.has(selectedSubmission?.id) ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="bg-[#1A1B23] border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {selectedSubmission?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedSubmission?.thumbnailUrl && (
              <img
                src={selectedSubmission.thumbnailUrl || "/placeholder.svg"}
                alt={selectedSubmission.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/50">Type:</span>
                <span className="ml-2 text-white">{selectedSubmission?.type}</span>
              </div>
              <div>
                <span className="text-white/50">Genre:</span>
                <span className="ml-2 text-white">{selectedSubmission?.genre}</span>
              </div>
              <div>
                <span className="text-white/50">Year:</span>
                <span className="ml-2 text-white">{selectedSubmission?.year}</span>
              </div>
              <div>
                <span className="text-white/50">Status:</span>
                <span className="ml-2 text-white">{selectedSubmission?.status}</span>
              </div>
            </div>
            <div>
              <span className="text-white/50 text-sm">Description:</span>
              <p className="text-white mt-1">{selectedSubmission?.description}</p>
            </div>
            {selectedSubmission?.videoUrl && (
              <div>
                <span className="text-white/50 text-sm">Video URL:</span>
                <a
                  href={selectedSubmission.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[#00FFFF] hover:underline mt-1 truncate"
                >
                  {selectedSubmission.videoUrl}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
