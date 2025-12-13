"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader, TrendingUp, CheckCircle, XCircle, Award } from "lucide-react"

interface TierRequest {
  id: string
  userId: string
  username: string
  email: string
  creatorName: string
  tierLevel: string
  totalViews: number
  ratePerView: number
  requestedAt: string
}

export function AdminCreatorTiersTab() {
  const [requests, setRequests] = useState<TierRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<TierRequest | null>(null)
  const [actionModal, setActionModal] = useState<"approve" | "deny" | null>(null)
  const [newTier, setNewTier] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/tiers")
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Fetch tier requests error:", error)
      toast.error("Failed to load tier requests")
    } finally {
      setLoading(false)
    }
  }

  const getNextTier = (currentTier: string, views: number) => {
    if (currentTier === "bronze" && views >= 10000) return "silver"
    if (currentTier === "silver" && views >= 50000) return "gold"
    if (currentTier === "gold" && views >= 200000) return "platinum"
    return currentTier
  }

  const handleAction = async () => {
    if (!selectedRequest || !actionModal) return

    setProcessing(true)

    try {
      const nextTier =
        actionModal === "approve"
          ? getNextTier(selectedRequest.tierLevel, selectedRequest.totalViews)
          : selectedRequest.tierLevel

      const response = await fetch("/api/admin/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUserId: selectedRequest.userId,
          action: actionModal,
          newTier: nextTier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to process tier action")
        return
      }

      toast.success(data.message)
      setActionModal(null)
      setSelectedRequest(null)
      fetchRequests()
    } catch (error) {
      console.error("Process tier action error:", error)
      toast.error("Failed to process action")
    } finally {
      setProcessing(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "bg-orange-700/20 text-orange-400"
      case "silver":
        return "bg-gray-400/20 text-gray-300"
      case "gold":
        return "bg-yellow-500/20 text-yellow-500"
      case "platinum":
        return "bg-cyan-500/20 text-cyan-400"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tier Upgrade Requests</h2>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No pending tier upgrade requests</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const nextTier = getNextTier(request.tierLevel, request.totalViews)
            return (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">
                      {request.creatorName?.[0]?.toUpperCase() || request.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold">{request.creatorName || request.username}</p>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTierColor(request.tierLevel)}`}>
                          <Award className="w-3 h-3 inline mr-1" />
                          {request.tierLevel}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTierColor(nextTier)}`}>
                          <Award className="w-3 h-3 inline mr-1" />
                          {nextTier}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{request.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Rate:</p>
                    <p className="font-semibold">${request.ratePerView}/view</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested:</p>
                    <p className="font-semibold">{new Date(request.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Eligible:</p>
                    <p className="font-semibold text-green-500">{nextTier !== request.tierLevel ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedRequest(request)
                      setNewTier(nextTier)
                      setActionModal("approve")
                    }}
                    disabled={nextTier === request.tierLevel}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Upgrade
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedRequest(request)
                      setActionModal("deny")
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={actionModal !== null} onOpenChange={() => setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal === "approve" && "Approve Tier Upgrade"}
              {actionModal === "deny" && "Deny Tier Upgrade"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionModal === "approve"
                ? `Upgrade ${selectedRequest?.creatorName || selectedRequest?.username} to ${newTier} tier?`
                : `Deny tier upgrade request from ${selectedRequest?.creatorName || selectedRequest?.username}?`}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActionModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAction} disabled={processing} className="flex-1">
                {processing && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
