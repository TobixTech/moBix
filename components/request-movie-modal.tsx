"use client"

import type React from "react"

import { useState } from "react"
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

interface RequestMovieModalProps {
  trigger?: React.ReactNode
  onClose?: () => void
}

export function RequestMovieModal({ trigger, onClose }: RequestMovieModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const year = formData.get("year") as string
    const details = formData.get("details") as string
    const email = formData.get("email") as string

    try {
      await submitFeedback({
        type: "REQUEST",
        title: title,
        details: `Year: ${year}\nDetails: ${details}`,
        email: email,
      })

      toast({
        title: "Request Submitted!",
        description: "We'll try our best to add this movie soon.",
      })
      setOpen(false)
      onClose?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit request. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="default"
      className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold shadow-lg transition-all duration-300 hover:scale-105"
    >
      <Film className="w-4 h-4 mr-2" />
      Request Movie
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1B23] border-[#2A2B33]">
        <DialogHeader>
          <DialogTitle className="text-white">Request a Movie</DialogTitle>
          <DialogDescription className="text-[#888888]">
            Can't find what you're looking for? Let us know!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right text-white">
              Movie Title *
            </Label>
            <Input
              id="title"
              name="title"
              className="col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666]"
              required
              placeholder="e.g. Inception"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right text-white">
              Year
            </Label>
            <Input
              id="year"
              name="year"
              className="col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666]"
              placeholder="e.g. 2010"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="details" className="text-right text-white">
              Details
            </Label>
            <Textarea
              id="details"
              name="details"
              className="col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666]"
              placeholder="Any specific version or language?"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-white">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              className="col-span-3 bg-[#0B0C10] border-[#2A2B33] text-white placeholder-[#666666]"
              placeholder="For updates (optional)"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
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
