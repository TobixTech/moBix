"use client"

import { useState, useEffect } from "react"
import {
  Users,
  UserCheck,
  Clock,
  Search,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Loader,
  Settings,
  Upload,
} from "lucide-react"
import {
  getCreatorRequests,
  getAllCreators,
  approveCreatorRequest,
  rejectCreatorRequest,
  grantCreatorAccess,
  updateCreatorLimits,
  suspendCreator,
  unsuspendCreator,
  addCreatorStrike,
  getCreatorStats,
  getCreatorSettings,
  updateCreatorSettings,
} from "@/lib/admin-creator-actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SubTab = "requests" | "creators" | "settings"

export function AdminCreatorManagementTab() {
  const [subTab, setSubTab] = useState<SubTab>("requests")
  const [requests, setRequests] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [requestFilter, setRequestFilter] = useState("pending")

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showEditLimitsModal, setShowEditLimitsModal] = useState(false)
  const [showStrikeModal, setShowStrikeModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [grantEmail, setGrantEmail] = useState("")
  const [strikeReason, setStrikeReason] = useState("")
  const [editLimits, setEditLimits] = useState({
    dailyUploadLimit: 4,
    dailyStorageLimitGb: 8,
    isAutoApproveEnabled: false,
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [requestFilter])

  const fetchData = async () => {
    setLoading(true)
    const [requestsRes, creatorsRes, statsRes, settingsRes] = await Promise.all([
      getCreatorRequests(requestFilter),
      getAllCreators(),
      getCreatorStats(),
      getCreatorSettings(),
    ])

    if (requestsRes.success) setRequests(requestsRes.requests || [])
    if (creatorsRes.success) setCreators(creatorsRes.creators || [])
    if (statsRes.success) setStats(statsRes.stats)
    if (settingsRes.success) setSettings(settingsRes.settings)
    setLoading(false)
  }

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(true)
    const result = await approveCreatorRequest(requestId, "admin")
    setActionLoading(false)

    if (result.success) {
      toast.success("Creator request approved!")
      fetchData()
    } else {
      toast.error(result.error || "Failed to approve")
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedItem || !rejectReason) return

    setActionLoading(true)
    const result = await rejectCreatorRequest(selectedItem.id, "admin", rejectReason)
    setActionLoading(false)

    if (result.success) {
      toast.success("Request rejected")
      setShowRejectModal(false)
      setRejectReason("")
      setSelectedItem(null)
      fetchData()
    } else {
      toast.error(result.error || "Failed to reject")
    }
  }

  const handleGrantAccess = async () => {
    if (!grantEmail) return

    setActionLoading(true)
    const result = await grantCreatorAccess(grantEmail, "admin")
    setActionLoading(false)

    if (result.success) {
      toast.success("Creator access granted!")
      setShowGrantModal(false)
      setGrantEmail("")
      fetchData()
    } else {
      toast.error(result.error || "Failed to grant access")
    }
  }

  const handleUpdateLimits = async () => {
    if (!selectedItem) return

    setActionLoading(true)
    const result = await updateCreatorLimits(selectedItem.id, editLimits)
    setActionLoading(false)

    if (result.success) {
      toast.success("Limits updated!")
      setShowEditLimitsModal(false)
      setSelectedItem(null)
      fetchData()
    } else {
      toast.error(result.error || "Failed to update limits")
    }
  }

  const handleSuspend = async (creatorId: string) => {
    const reason = prompt("Enter suspension reason:")
    if (!reason) return

    const result = await suspendCreator(creatorId, reason)
    if (result.success) {
      toast.success("Creator suspended")
      fetchData()
    } else {
      toast.error(result.error || "Failed to suspend")
    }
  }

  const handleUnsuspend = async (creatorId: string) => {
    const result = await unsuspendCreator(creatorId)
    if (result.success) {
      toast.success("Creator reinstated")
      fetchData()
    } else {
      toast.error(result.error || "Failed to unsuspend")
    }
  }

  const handleAddStrike = async () => {
    if (!selectedItem || !strikeReason) return

    setActionLoading(true)
    const result = await addCreatorStrike(selectedItem.id, strikeReason, "admin")
    setActionLoading(false)

    if (result.success) {
      toast.success(`Strike added. Total: ${result.totalStrikes}`)
      setShowStrikeModal(false)
      setStrikeReason("")
      setSelectedItem(null)
      fetchData()
    } else {
      toast.error(result.error || "Failed to add strike")
    }
  }

  const handleUpdateSettings = async () => {
    if (!settings) return

    setActionLoading(true)
    const result = await updateCreatorSettings(settings)
    setActionLoading(false)

    if (result.success) {
      toast.success("Settings updated!")
    } else {
      toast.error(result.error || "Failed to update settings")
    }
  }

  const filteredCreators = creators.filter(
    (c) =>
      c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Users className="w-4 h-4" />
            Total Creators
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalCreators || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <UserCheck className="w-4 h-4 text-green-400" />
            Active
          </div>
          <p className="text-2xl font-bold text-green-400">{stats?.activeCreators || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Requests
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.pendingRequests || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Upload className="w-4 h-4 text-purple-400" />
            Pending Content
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats?.pendingSubmissions || 0}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: "requests", label: "Requests", icon: Clock },
          { id: "creators", label: "All Creators", icon: Users },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as SubTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              subTab === tab.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Requests Tab */}
          {subTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {["pending", "approved", "rejected", "all"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRequestFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                        requestFilter === filter
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  <Plus className="w-4 h-4" />
                  Grant Access
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No {requestFilter} requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">
                            {request.user?.firstName || request.user?.username || "User"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              request.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : request.status === "approved"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">{request.user?.email}</p>
                        <div className="flex gap-4 mt-2 text-xs text-white/50">
                          <span>Account Age: {request.accountAgeDays} days</span>
                          <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(request)
                              setShowRejectModal(true)
                            }}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {subTab === "creators" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search creators..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {filteredCreators.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No creators found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white/60 text-sm border-b border-white/10">
                        <th className="pb-3 pr-4">Creator</th>
                        <th className="pb-3 pr-4">Uploads</th>
                        <th className="pb-3 pr-4">Views</th>
                        <th className="pb-3 pr-4">Strikes</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCreators.map((creator) => (
                        <tr key={creator.id} className="border-b border-white/5">
                          <td className="py-4 pr-4">
                            <p className="text-white font-medium">
                              {creator.user?.username || creator.user?.firstName || "Creator"}
                            </p>
                            <p className="text-white/50 text-sm">{creator.user?.email}</p>
                          </td>
                          <td className="py-4 pr-4 text-white">{creator.totalUploads}</td>
                          <td className="py-4 pr-4 text-white">{creator.totalViews}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                creator.strikeCount >= 2
                                  ? "bg-red-500/20 text-red-400"
                                  : creator.strikeCount >= 1
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {creator.strikeCount}/3
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                creator.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {creator.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedItem(creator)
                                  setEditLimits({
                                    dailyUploadLimit: creator.dailyUploadLimit,
                                    dailyStorageLimitGb: Number(creator.dailyStorageLimitGb),
                                    isAutoApproveEnabled: creator.isAutoApproveEnabled,
                                  })
                                  setShowEditLimitsModal(true)
                                }}
                                className="p-2 bg-white/5 text-white/70 rounded hover:bg-white/10 transition"
                                title="Edit Limits"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(creator)
                                  setShowStrikeModal(true)
                                }}
                                className="p-2 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition"
                                title="Add Strike"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                              {creator.status === "active" ? (
                                <button
                                  onClick={() => handleSuspend(creator.id)}
                                  className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition"
                                  title="Suspend"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnsuspend(creator.id)}
                                  className="p-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition"
                                  title="Reinstate"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {subTab === "settings" && settings && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                <h3 className="text-white font-bold">Creator System Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Min Account Age (days)</label>
                    <input
                      type="number"
                      value={settings.minAccountAgeDays}
                      onChange={(e) => setSettings({ ...settings, minAccountAgeDays: Number.parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Max Account Age (days)</label>
                    <input
                      type="number"
                      value={settings.maxAccountAgeDays}
                      onChange={(e) => setSettings({ ...settings, maxAccountAgeDays: Number.parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Default Daily Upload Limit</label>
                    <input
                      type="number"
                      value={settings.defaultDailyUploadLimit}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultDailyUploadLimit: Number.parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Default Daily Storage (GB)</label>
                    <input
                      type="number"
                      value={settings.defaultDailyStorageLimitGb}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultDailyStorageLimitGb: Number.parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Max Strikes Before Suspension</label>
                    <input
                      type="number"
                      value={settings.maxStrikesBeforeSuspension}
                      onChange={(e) =>
                        setSettings({ ...settings, maxStrikesBeforeSuspension: Number.parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.isCreatorSystemEnabled}
                      onChange={(e) => setSettings({ ...settings, isCreatorSystemEnabled: e.target.checked })}
                      className="w-5 h-5 accent-cyan-500"
                    />
                    <span className="text-white">Enable Creator System</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoApproveNewCreators}
                      onChange={(e) => setSettings({ ...settings, autoApproveNewCreators: e.target.checked })}
                      className="w-5 h-5 accent-cyan-500"
                    />
                    <span className="text-white">Auto-approve new creator requests</span>
                  </label>
                </div>

                <button
                  onClick={handleUpdateSettings}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-[#1A1B23] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Creator Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/60">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={!rejectReason || actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant Access Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="bg-[#1A1B23] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Grant Creator Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/60">Enter the email of the user to grant creator access:</p>
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="user@email.com"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowGrantModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={!grantEmail || actionLoading}
                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
              >
                {actionLoading ? "Granting..." : "Grant Access"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Limits Modal */}
      <Dialog open={showEditLimitsModal} onOpenChange={setShowEditLimitsModal}>
        <DialogContent className="bg-[#1A1B23] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Creator Limits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Daily Upload Limit</label>
              <input
                type="number"
                value={editLimits.dailyUploadLimit}
                onChange={(e) => setEditLimits({ ...editLimits, dailyUploadLimit: Number.parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Daily Storage Limit (GB)</label>
              <input
                type="number"
                value={editLimits.dailyStorageLimitGb}
                onChange={(e) =>
                  setEditLimits({ ...editLimits, dailyStorageLimitGb: Number.parseFloat(e.target.value) })
                }
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editLimits.isAutoApproveEnabled}
                onChange={(e) => setEditLimits({ ...editLimits, isAutoApproveEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500"
              />
              <span className="text-white">Auto-approve submissions</span>
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditLimitsModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLimits}
                disabled={actionLoading}
                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strike Modal */}
      <Dialog open={showStrikeModal} onOpenChange={setShowStrikeModal}>
        <DialogContent className="bg-[#1A1B23] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Strike</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/60">Please provide a reason for the strike:</p>
            <textarea
              value={strikeReason}
              onChange={(e) => setStrikeReason(e.target.value)}
              placeholder="Reason for strike..."
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowStrikeModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStrike}
                disabled={!strikeReason || actionLoading}
                className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
              >
                {actionLoading ? "Adding..." : "Add Strike"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
