"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader, AlertCircle, Wallet } from "lucide-react"

interface CreatorWithdrawalModalProps {
  open: boolean
  onClose: () => void
  balance: number
  wallet: { cryptoType: string; walletAddress: string } | null
  onSuccess: () => void
}

export function CreatorWithdrawalModal({ open, onClose, balance, wallet, onSuccess }: CreatorWithdrawalModalProps) {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  const feePercentage = 3 // 3% fee
  const feeAmount = (balance * feePercentage) / 100
  const amountAfterFee = balance - feeAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (balance < 18) {
      toast.error("Minimum withdrawal is $18")
      return
    }

    if (pin.length < 4) {
      toast.error("Please enter your withdrawal PIN")
      return
    }

    if (!wallet) {
      toast.error("Please set up your wallet first")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/creator/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUSD: balance,
          cryptoType: wallet.cryptoType,
          walletAddress: wallet.walletAddress,
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to submit withdrawal request")
        return
      }

      toast.success(data.message || "Withdrawal request submitted!")
      setPin("")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.error("Failed to submit withdrawal request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-semibold">${balance.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee ({feePercentage}%):</span>
              <span className="text-red-500">-${feeAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">You'll receive:</span>
              <span className="text-lg font-bold text-green-500">${amountAfterFee.toFixed(2)}</span>
            </div>
          </div>

          {wallet && (
            <div className="bg-muted/30 p-3 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">Sending to:</p>
              <p className="font-mono text-sm font-semibold">{wallet.cryptoType}</p>
              <p className="font-mono text-xs text-muted-foreground truncate">{wallet.walletAddress}</p>
            </div>
          )}

          {balance < 18 && (
            <div className="flex items-start gap-2 text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Minimum withdrawal is $18. Keep earning to reach the threshold!</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="withdrawal-pin">Withdrawal PIN</Label>
            <Input
              id="withdrawal-pin"
              type="password"
              placeholder="Enter your 4-6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              disabled={loading || balance < 18 || !wallet}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || balance < 18 || !wallet || pin.length < 4}>
              {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
