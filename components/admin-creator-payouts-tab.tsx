"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader, CheckCircle, XCircle, ExternalLink, DollarSign, Clock, AlertTriangle } from "lucide-react"

interface PayoutRequest {
  id: string
  userId: string
  username: string
  email: string
  creatorName: string
  profileImage: string
  amountUSD: number
  cryptoType: string
  walletAddress: string
  status: string
  requestedAt: string
  processedAt?: string
  transactionHash?: string
  rejectionReason?: string
  tierLevel: string
  strikeCount: number
}

export function AdminCreatorPayoutsTab() {
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "completed" | "rejected">("pending")
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null)
  const [actionModal, setActionModal] = useState<"approve" | "complete" | "reject" | null>(null)
  const [transactionHash, setTransactionHash] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payouts?status=${statusFilter}`)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Fetch requests error:", error)
      toast.error("Failed to load payout requests")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedRequest || !actionModal) return

    if (actionModal === "complete" && !transactionHash) {
      toast.error("Please enter transaction hash")
      return
    }

    if (actionModal === "reject" && !rejectionReason) {
      toast.error("Please enter rejection reason")
      return
    }

    setProcessing(true)

    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: actionModal,
          transactionHash,
          adminNote,
          rejectionReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to process payout")
        return
      }

      toast.success(data.message)
      setActionModal(null)
      setSelectedRequest(null)
      setTransactionHash("")
      setAdminNote("")
      setRejectionReason("")
      fetchRequests()
    } catch (error) {
      console.error("Process action error:", error)
      toast.error("Failed to process action")
    } finally {
      setProcessing(false)
    }
  }

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500"
      case "approved":
        return "bg-blue-500/20 text-blue-500"
      case "completed":
        return "bg-green-500/20 text-green-500"
      case "rejected":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Creator Payouts</h2>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "completed", "rejected"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status as any)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No {statusFilter} requests found</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
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
                      <span className={`text-xs px-2 py-0.5 rounded ${getBadgeColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-500 capitalize">
                        {request.tierLevel || "bronze"}
                      </span>
                      {request.strikeCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {request.strikeCount} {request.strikeCount === 1 ? "strike" : "strikes"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-500">${request.amountUSD.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(request.requestedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Crypto Type:</p>
                  <p className="font-mono font-semibold">{request.cryptoType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wallet Address:</p>
                  <p className="font-mono text-xs truncate">{request.walletAddress}</p>
                </div>
              </div>

              {request.transactionHash && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Transaction Hash:</p>
                  <a
                    href={`https://blockchain-explorer.com/${request.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    {request.transactionHash.slice(0, 20)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {request.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-sm">
                  <p className="text-red-500 font-semibold">Rejection Reason:</p>
                  <p className="text-muted-foreground">{request.rejectionReason}</p>
                </div>
              )}

              {statusFilter === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedRequest(request)
                      setActionModal("approve")
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedRequest(request)
                      setActionModal("reject")
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {statusFilter === "approved" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedRequest(request)
                    setActionModal("complete")
                  }}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={actionModal !== null} onOpenChange={() => setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal === "approve" && "Approve Payout"}
              {actionModal === "complete" && "Complete Payout"}
              {actionModal === "reject" && "Reject Payout"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionModal === "complete" && (
              <div className="space-y-2">
                <Label>Transaction Hash (Required)</Label>
                <Input
                  placeholder="Enter blockchain transaction hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                />
              </div>
            )}

            {actionModal === "approve" && (
              <div className="space-y-2">
                <Label>Admin Note (Optional)</Label>
                <Input
                  placeholder="Add a note for your records"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            )}

            {actionModal === "reject" && (
              <div className="space-y-2">
                <Label>Rejection Reason (Required)</Label>
                <Input
                  placeholder="Explain why this payout is rejected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

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
