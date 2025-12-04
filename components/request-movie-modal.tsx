"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitFeedback } from "@/lib/server-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Film } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface RequestMovieModalProps {
  trigger?: React.ReactNode
  onClose?: () => void
}

export function RequestMovieModal({ trigger, onClose }: RequestMovieModalProps) {
  const { user, isSignedIn } = useUser()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress)
    }
  }, [isSignedIn, user])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const year = formData.get("year") as string
    const details = formData.get("details") as string
    const userEmail = formData.get("email") as string

    try {
      const result = await submitFeedback({
        type: "REQUEST",
        title: title,
        details: `Year: ${year}\nDetails: ${details}`,
        email: userEmail,
      })

      if (result.success) {
        toast({
          title: "Request Submitted!",
          description: "We'll try our best to add this movie soon.",
        })
        setOpen(false)
        onClose?.()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to submit request. Please try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to submit request. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="default"
      className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-bold shadow-lg shadow-[#00FFFF]/30 hover:shadow-[#00FFFF]/50 transition-all duration-300 hover:scale-105"
    >
      <Film className="w-4 h-4 mr-2" />
      Request Movie
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] bg-[#1A1B23] border-[#2A2B33] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#00FFFF]" />
            Request a Movie
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            Can't find what you're looking for? Let us know and we'll try to add it!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="title" className="sm:text-right text-white">
              Movie Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              className="sm:col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666] focus:border-[#00FFFF] focus:ring-[#00FFFF]/30"
              required
              placeholder="e.g. Inception"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="year" className="sm:text-right text-white">
              Year
            </Label>
            <Input
              id="year"
              name="year"
              className="sm:col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666] focus:border-[#00FFFF] focus:ring-[#00FFFF]/30"
              placeholder="e.g. 2010"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="details" className="sm:text-right text-white">
              Details
            </Label>
            <Textarea
              id="details"
              name="details"
              className="sm:col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666] focus:border-[#00FFFF] focus:ring-[#00FFFF]/30"
              placeholder="Any specific version or language?"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="email" className="sm:text-right text-white">
              Email {isSignedIn && <span className="text-[#00FFFF] text-xs">(auto)</span>}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSignedIn}
              className="sm:col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666] focus:border-[#00FFFF] focus:ring-[#00FFFF]/30 disabled:opacity-70"
              placeholder="For updates (optional)"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-bold shadow-lg shadow-[#00FFFF]/30 hover:shadow-[#00FFFF]/50 transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
