"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Send, Loader2, User, Globe, Check, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface SendPromoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserForTargeting {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  country: string | null
}

export function SendPromoModal({ isOpen, onClose }: SendPromoModalProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserForTargeting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedUsers([])
      setSearchQuery("")
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    console.log("[v0] SendPromoModal - loading users")

    try {
      const res = await fetch("/api/admin/users-for-targeting", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      })

      console.log("[v0] SendPromoModal - response status:", res.status)

      const data = await res.json()
      console.log("[v0] SendPromoModal - response data:", data)

      if (res.ok && data.success && Array.isArray(data.users)) {
        setUsers(data.users)
        console.log("[v0] SendPromoModal - loaded users:", data.users.length)
      } else {
        setError(data.error || "Failed to load users")
        setUsers([])
        console.error("[v0] SendPromoModal - error:", data.error)
      }
    } catch (err) {
      console.error("[v0] SendPromoModal - fetch error:", err)
      setError("Network error. Please try again.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const selectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    }
  }

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers) {
      try {
        const res = await fetch("/api/promotions/target-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, reason: "Admin direct send" }),
        })
        const result = await res.json()

        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setSending(false)

    if (successCount > 0) {
      toast({
        title: "Promotions Sent",
        description: `Successfully targeted ${successCount} user(s). ${failCount > 0 ? `${failCount} failed.` : ""}`,
      })
      setSelectedUsers([])
      onClose()
    } else {
      toast({
        title: "Failed to send",
        description: "Could not target any users. They may already have pending promotions.",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[80vh] bg-gradient-to-b from-[#1a1b20] to-[#0d0e12] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Send Promotion to Users</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="p-2 rounded-full hover:bg-white/10 transition"
                title="Refresh users"
              >
                <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-white/60">{loading ? "Loading..." : `${users.length} users available`}</p>
              <div className="flex items-center gap-3">
                {filteredUsers.length > 0 && (
                  <button onClick={selectAll} className="text-sm text-cyan-400 hover:text-cyan-300 transition">
                    {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
                  </button>
                )}
                {selectedUsers.length > 0 && (
                  <span className="text-sm text-cyan-400 font-medium">{selectedUsers.length} selected</span>
                )}
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                <p className="text-white/60">Loading users...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-red-400 text-center">{error}</p>
                <Button
                  variant="outline"
                  onClick={loadUsers}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <User className="w-12 h-12 text-white/30" />
                <p className="text-white/60">No users found in database</p>
                <Button
                  variant="outline"
                  onClick={loadUsers}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-white/60">No users match "{searchQuery}"</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                    selectedUsers.includes(user.id)
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedUsers.includes(user.id) ? "bg-cyan-500" : "bg-white/10"
                    }`}
                  >
                    {selectedUsers.includes(user.id) ? (
                      <Check className="w-5 h-5 text-black" />
                    ) : (
                      <User className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-medium truncate">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : "No name"}
                    </p>
                    <p className="text-sm text-white/60 truncate">{user.email}</p>
                  </div>
                  {user.country && (
                    <div className="flex items-center gap-1 text-sm text-white/40 flex-shrink-0">
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">{user.country}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || selectedUsers.length === 0}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {selectedUsers.length} User(s)
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SendPromoModal
