"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader, Plus, Trash2, ToggleLeft, ToggleRight, DollarSign, Users } from "lucide-react"

interface Offer {
  id: string
  offerType: string
  title: string
  description: string
  bonusAmount: number | null
  multiplier: number | null
  conditions: any
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  createdByName: string
  redemptionCount: number
}

export function AdminCreatorOffersTab() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [bonusModal, setBonusModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Create offer form state
  const [offerType, setOfferType] = useState("welcome")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [bonusAmount, setBonusAmount] = useState("")
  const [multiplier, setMultiplier] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  // Bonus form state
  const [bonusAmountInput, setBonusAmountInput] = useState("")
  const [bonusReason, setBonusReason] = useState("")

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/offers")
      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error("Fetch offers error:", error)
      toast.error("Failed to load offers")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description) {
      toast.error("Title and description are required")
      return
    }

    setProcessing(true)

    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          offerData: {
            offerType,
            title,
            description,
            bonusAmount: bonusAmount ? Number.parseFloat(bonusAmount) : null,
            multiplier: multiplier ? Number.parseFloat(multiplier) : null,
            conditions: {},
            expiresAt: expiresAt || null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to create offer")
        return
      }

      toast.success(data.message)
      setCreateModal(false)
      resetForm()
      fetchOffers()
    } catch (error) {
      console.error("Create offer error:", error)
      toast.error("Failed to create offer")
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleOffer = async (offerId: string) => {
    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", offerId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to toggle offer")
        return
      }

      toast.success(data.message)
      fetchOffers()
    } catch (error) {
      console.error("Toggle offer error:", error)
      toast.error("Failed to toggle offer")
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return

    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", offerId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to delete offer")
        return
      }

      toast.success(data.message)
      fetchOffers()
    } catch (error) {
      console.error("Delete offer error:", error)
      toast.error("Failed to delete offer")
    }
  }

  const handleSendMassBonus = async () => {
    if (!bonusAmountInput || !bonusReason) {
      toast.error("Bonus amount and reason are required")
      return
    }

    if (!confirm(`Send $${bonusAmountInput} to ALL creators?`)) return

    setProcessing(true)

    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mass-bonus",
          bonusAmount: Number.parseFloat(bonusAmountInput),
          bonusReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send mass bonus")
        return
      }

      toast.success(data.message)
      setBonusModal(false)
      setBonusAmountInput("")
      setBonusReason("")
    } catch (error) {
      console.error("Mass bonus error:", error)
      toast.error("Failed to send mass bonus")
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setOfferType("welcome")
    setTitle("")
    setDescription("")
    setBonusAmount("")
    setMultiplier("")
    setExpiresAt("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Creator Offers & Promotions</h2>
        <div className="flex gap-2">
          <Button onClick={() => setBonusModal(true)} variant="outline" size="sm">
            <DollarSign className="w-4 h-4 mr-2" />
            Send Mass Bonus
          </Button>
          <Button onClick={() => setCreateModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No offers created yet</div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div key={offer.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{offer.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded capitalize ${offer.isActive ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}
                    >
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-500 capitalize">
                      {offer.offerType}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    {offer.bonusAmount && (
                      <span className="text-green-500 font-semibold">+${offer.bonusAmount} bonus</span>
                    )}
                    {offer.multiplier && (
                      <span className="text-blue-500 font-semibold">{offer.multiplier}x multiplier</span>
                    )}
                    {offer.expiresAt && (
                      <span className="text-yellow-500">Expires: {new Date(offer.expiresAt).toLocaleDateString()}</span>
                    )}
                    <span className="text-muted-foreground">{offer.redemptionCount} redemptions</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleToggleOffer(offer.id)}>
                    {offer.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOffer(offer.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="space-y-2">
              <Label>Offer Type</Label>
              <select
                className="w-full p-2 border rounded-lg bg-background"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
              >
                <option value="welcome">Welcome Bonus</option>
                <option value="challenge">Upload Challenge</option>
                <option value="seasonal">Seasonal Promotion</option>
                <option value="quality">Quality Bonus</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Upload 5 Movies This Month"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the offer and how creators can earn it"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Multiplier (optional)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiration Date (optional)</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="flex-1">
                {processing && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Create Offer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bonusModal} onOpenChange={setBonusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Mass Bonus to All Creators</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bonus Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="10.00"
                value={bonusAmountInput}
                onChange={(e) => setBonusAmountInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Holiday bonus for all creators"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBonusModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSendMassBonus} disabled={processing} className="flex-1">
                {processing && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                <Users className="w-4 h-4 mr-2" />
                Send to All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
