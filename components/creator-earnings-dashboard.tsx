"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  Eye,
  TrendingUp,
  Wallet,
  Calendar,
  Film,
  Tv,
  Settings,
  Shield,
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { CreatorAnalyticsTab } from "@/components/creator-analytics-tab"

interface CreatorEarningsDashboardProps {
  onWalletSetup: () => void
}

export function CreatorEarningsDashboard({ onWalletSetup }: CreatorEarningsDashboardProps) {
  const [earnings, setEarnings] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    setLoading(true)
    try {
      const [earningsRes, walletRes] = await Promise.all([fetch("/api/creator/earnings"), fetch("/api/creator/wallet")])

      if (earningsRes.ok) {
        const earningsData = await earningsRes.json()
        setEarnings(earningsData)
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json()
        setWallet(walletData.wallet)
      }
    } catch (error) {
      console.error("[v0] Error fetching earnings:", error)
      toast.error("Failed to load earnings data")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-white/70">Loading earnings data...</p>
        </div>
      </div>
    )
  }

  const tierInfo = {
    bronze: { name: "Bronze", color: "#CD7F32", rate: "$0.0008/view" },
    silver: { name: "Silver", color: "#C0C0C0", rate: "$0.005/view" },
    gold: { name: "Gold", color: "#FFD700", rate: "$0.01/view" },
    platinum: { name: "Platinum", color: "#E5E4E2", rate: "$0.025/view" },
  }

  const currentTier = tierInfo[earnings?.tierLevel as keyof typeof tierInfo] || tierInfo.bronze

  return (
    <div className="space-y-6">
      {/* Tabs for Overview and Analytics */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className="rounded-b-none"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "ghost"}
          onClick={() => setActiveTab("analytics")}
          className="rounded-b-none"
        >
          Analytics
        </Button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Wallet Setup Warning */}
          {!wallet && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-500 font-semibold mb-1">Wallet Setup Required</h3>
                <p className="text-white/70 text-sm mb-3">
                  You need to add a crypto wallet to receive payouts. Set up your wallet to start earning.
                </p>
                <Button
                  onClick={() => setShowWalletModal(true)}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Add Wallet Now
                </Button>
              </div>
            </div>
          )}

          {/* Earnings Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <DollarSign className="w-5 h-5 text-cyan-500" />
                </div>
                <span className="text-white/70 text-sm">Current Balance</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">${earnings?.currentBalance?.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-white/50">Available for withdrawal</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-white/70 text-sm">Total Earnings</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">${earnings?.totalEarnings?.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-white/50">Lifetime earnings</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Eye className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-white/70 text-sm">Total Views</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{earnings?.totalViews?.toLocaleString() || "0"}</p>
              <p className="text-xs text-white/50">All-time views</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-white/70 text-sm">This Month</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{earnings?.viewsThisMonth?.toLocaleString() || "0"}</p>
              <p className="text-xs text-white/50">views this month</p>
            </div>
          </div>

          {/* Tier Status & EPV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Current Tier</h3>
                <div
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: `${currentTier.color}20`, color: currentTier.color }}
                >
                  {currentTier.name}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Earning Rate</span>
                  <span className="text-white font-semibold">{currentTier.rate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Views</span>
                  <span className="text-white font-semibold">{earnings?.totalViews?.toLocaleString()}</span>
                </div>
                {earnings?.totalViews < 10000 && (
                  <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
                    <p className="text-xs text-white/70">
                      {(10000 - earnings?.totalViews).toLocaleString()} more views to reach Silver tier
                    </p>
                    <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                        style={{ width: `${Math.min(100, (earnings?.totalViews / 10000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Wallet Status</h3>
                {wallet ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              {wallet ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Crypto Type</span>
                    <span className="text-white font-semibold">{wallet.cryptoType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Wallet Address</span>
                    <span className="text-white font-mono text-xs">
                      {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWalletModal(true)}
                    className="w-full mt-2 border-zinc-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">No wallet configured yet</p>
                  <Button
                    onClick={() => setShowWalletModal(true)}
                    size="sm"
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Add Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Earnings History Graph */}
          {earnings?.earningsHistory && earnings.earningsHistory.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Earnings History</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earnings.earningsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="earnings" stroke="#00FFFF" strokeWidth={2} dot={{ fill: "#00FFFF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Performing Content */}
          {earnings?.topContent && earnings.topContent.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Top Performing Content</h3>
              <div className="space-y-3">
                {earnings.topContent.map((content: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {content.contentType === "movie" ? (
                        <Film className="w-5 h-5 text-cyan-500" />
                      ) : (
                        <Tv className="w-5 h-5 text-purple-500" />
                      )}
                      <div>
                        <p className="text-white font-medium">{content.title}</p>
                        <p className="text-xs text-white/50">{content.views} views</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">${content.earnings.toFixed(2)}</p>
                      <p className="text-xs text-white/50">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "analytics" && <CreatorAnalyticsTab />}
      {/* Wallet Setup Modal */}
      {showWalletModal && (
        <WalletSetupModal
          existingWallet={wallet}
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => {
            fetchEarningsData()
            setShowWalletModal(false)
          }}
        />
      )}

      {/* PIN Setup Modal */}
      {showPinModal && (
        <PinSetupModal
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setShowPinModal(false)
            toast.success("Withdrawal PIN set successfully")
          }}
        />
      )}
    </div>
  )
}

function WalletSetupModal({
  existingWallet,
  onClose,
  onSuccess,
}: {
  existingWallet: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [cryptoType, setCryptoType] = useState(existingWallet?.cryptoType || "")
  const [walletAddress, setWalletAddress] = useState(existingWallet?.walletAddress || "")
  const [saving, setSaving] = useState(false)

  const canChange = existingWallet ? new Date() >= new Date(existingWallet.canChangeAt) : true

  const handleSave = async () => {
    if (!cryptoType || !walletAddress.trim()) {
      toast.error("Please select crypto type and enter wallet address")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/creator/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cryptoType, walletAddress: walletAddress.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(existingWallet ? "Wallet updated successfully" : "Wallet added successfully")
        onSuccess()
      } else {
        toast.error(data.error || "Failed to save wallet")
      }
    } catch (error) {
      toast.error("Failed to save wallet")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{existingWallet ? "Manage Wallet" : "Add Crypto Wallet"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {existingWallet && !canChange && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-500 font-medium">Wallet Change Locked</p>
                <p className="text-xs text-white/60 mt-1">
                  You can change your wallet again on {new Date(existingWallet.canChangeAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Crypto Type</label>
            <select
              value={cryptoType}
              onChange={(e) => setCryptoType(e.target.value)}
              disabled={existingWallet && !canChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="">Select crypto type</option>
              <option value="SOL">Solana (SOL)</option>
              <option value="TRC20">USDT (TRC20 - Tron)</option>
              <option value="BEP20">USDT (BEP20 - Binance Smart Chain)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Wallet Address</label>
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              disabled={existingWallet && !canChange}
              className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
            />
          </div>

          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-white/60">
              <Shield className="w-3 h-3 inline mr-1" />
              Make sure your wallet address is correct. You can only change it once every 3 weeks.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (existingWallet && !canChange)}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : "Save Wallet"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PinSetupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error("PIN must be 4-6 digits")
      return
    }

    if (pin !== confirmPin) {
      toast.error("PINs do not match")
      return
    }

    if (!/^\d+$/.test(pin)) {
      toast.error("PIN must contain only numbers")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/creator/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        toast.error(data.error || "Failed to set PIN")
      }
    } catch (error) {
      toast.error("Failed to set PIN")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Set Withdrawal PIN</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Enter PIN (4-6 digits)</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter PIN"
              maxLength={6}
              className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Confirm PIN</label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Confirm PIN"
              maxLength={6}
              className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest"
            />
          </div>

          <div className="p-3 bg-zinc-800 rounded-lg">
            <p className="text-xs text-white/60">
              <Lock className="w-3 h-3 inline mr-1" />
              This PIN will be required for all withdrawal requests. Keep it safe and don't share it.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : "Set PIN"}
          </Button>
        </div>
      </div>
    </div>
  )
}
