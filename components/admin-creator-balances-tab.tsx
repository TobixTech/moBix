"use client"

import { useState, useEffect } from "react"
import { DollarSign, TrendingUp, Search, Plus, Minus, Settings, Loader, Gift, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function AdminCreatorBalancesTab() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCreator, setSelectedCreator] = useState<any>(null)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showDebitModal, setShowDebitModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Settings state
  const [monthlyLimit, setMonthlyLimit] = useState(100)
  const [canWithdraw, setCanWithdraw] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/creator-balances")
      const data = await res.json()
      if (data.success) {
        setCreators(data.creators || [])
      } else {
        toast.error(data.error || "Failed to fetch creators")
      }
    } catch (error) {
      console.error("Fetch creators error:", error)
      toast.error("Failed to load creators")
    }
    setLoading(false)
  }

  const handleFund = async () => {
    if (!selectedCreator || !amount || !reason) {
      toast.error("Please fill all fields")
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/creator-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fund",
          userId: selectedCreator.userId,
          amount: Number.parseFloat(amount),
          reason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Funded $${amount} to creator`)
        setShowFundModal(false)
        setAmount("")
        setReason("")
        setSelectedCreator(null)
        fetchCreators()
      } else {
        toast.error(data.error || "Failed to fund balance")
      }
    } catch (error) {
      console.error("Fund error:", error)
      toast.error("Failed to fund balance")
    }
    setActionLoading(false)
  }

  const handleDebit = async () => {
    if (!selectedCreator || !amount || !reason) {
      toast.error("Please fill all fields")
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/creator-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "debit",
          userId: selectedCreator.userId,
          amount: Number.parseFloat(amount),
          reason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Debited $${amount} from creator`)
        setShowDebitModal(false)
        setAmount("")
        setReason("")
        setSelectedCreator(null)
        fetchCreators()
      } else {
        toast.error(data.error || "Failed to debit balance")
      }
    } catch (error) {
      console.error("Debit error:", error)
      toast.error("Failed to debit balance")
    }
    setActionLoading(false)
  }

  const handleUpdateSettings = async () => {
    if (!selectedCreator) return

    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/creator-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSettings",
          userId: selectedCreator.userId,
          monthlyLimit,
          canWithdraw,
          isPremium,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Settings updated successfully")
        setShowSettingsModal(false)
        setSelectedCreator(null)
        fetchCreators()
      } else {
        toast.error(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Update settings error:", error)
      toast.error("Failed to update settings")
    }
    setActionLoading(false)
  }

  const filteredCreators = creators.filter(
    (c) =>
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalBalance = creators.reduce((sum, c) => sum + Number.parseFloat(c.currentBalance || 0), 0)
  const totalPaidOut = creators.reduce((sum, c) => sum + Number.parseFloat(c.paidOut || 0), 0)
  const totalEarnings = creators.reduce((sum, c) => sum + Number.parseFloat(c.totalEarnings || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-white/70 text-sm">Total Pending Balance</span>
          </div>
          <p className="text-3xl font-bold text-white">${totalBalance.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/70 text-sm">Total Paid Out</span>
          </div>
          <p className="text-3xl font-bold text-white">${totalPaidOut.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/70 text-sm">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold text-white">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search creators by email or username..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Creators Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No creators found</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-left text-white/60 text-sm">
                  <th className="px-6 py-4 font-medium">Creator</th>
                  <th className="px-6 py-4 font-medium">Tier</th>
                  <th className="px-6 py-4 font-medium">Views</th>
                  <th className="px-6 py-4 font-medium">Current Balance</th>
                  <th className="px-6 py-4 font-medium">Paid Out</th>
                  <th className="px-6 py-4 font-medium">Wallet</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreators.map((creator) => (
                  <tr key={creator.userId} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{creator.username || creator.firstName || "Creator"}</p>
                        <p className="text-white/50 text-sm">{creator.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-400 uppercase">
                        {creator.tierLevel || "bronze"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{creator.totalViews?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <span className="text-cyan-400 font-bold">
                        ${Number.parseFloat(creator.currentBalance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-medium">
                        ${Number.parseFloat(creator.paidOut || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {creator.walletAddress ? (
                        <div>
                          <p className="text-white/70 text-xs font-mono">
                            {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                          </p>
                          <p className="text-white/50 text-xs">{creator.cryptoType}</p>
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">No wallet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {creator.isPremium && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">
                            Premium
                          </span>
                        )}
                        {!creator.canWithdraw && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCreator(creator)
                            setShowFundModal(true)
                          }}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition"
                          title="Fund Balance"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCreator(creator)
                            setShowDebitModal(true)
                          }}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                          title="Debit Balance"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCreator(creator)
                            setMonthlyLimit(creator.monthlyWithdrawalLimit || 100)
                            setCanWithdraw(creator.canWithdraw !== false)
                            setIsPremium(creator.isPremium || false)
                            setShowSettingsModal(true)
                          }}
                          className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fund Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent className="bg-[#0A0B14] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Fund Creator Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Creator</label>
              <p className="text-white font-medium">{selectedCreator?.email}</p>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Amount (USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Bonus, promotion, etc."
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleFund}
                disabled={actionLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Fund Balance"}
              </Button>
              <Button onClick={() => setShowFundModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debit Modal */}
      <Dialog open={showDebitModal} onOpenChange={setShowDebitModal}>
        <DialogContent className="bg-[#0A0B14] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Debit Creator Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Creator</label>
              <p className="text-white font-medium">{selectedCreator?.email}</p>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Amount (USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Chargeback, fraud, etc."
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDebit}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Debit Balance"}
              </Button>
              <Button onClick={() => setShowDebitModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="bg-[#0A0B14] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Creator Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Creator</label>
              <p className="text-white font-medium">{selectedCreator?.email}</p>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Monthly Withdrawal Limit (USD)</label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number.parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="canWithdraw"
                checked={canWithdraw}
                onChange={(e) => setCanWithdraw(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="canWithdraw" className="text-white cursor-pointer">
                Can Withdraw
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPremium"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPremium" className="text-white cursor-pointer">
                Premium Creator
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleUpdateSettings}
                disabled={actionLoading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              >
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Update Settings"}
              </Button>
              <Button onClick={() => setShowSettingsModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
