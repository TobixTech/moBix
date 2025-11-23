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

export function RequestMovieModal() {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Film className="w-4 h-4 mr-2" />
          Request Movie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Movie</DialogTitle>
          <DialogDescription>Can't find what you're looking for? Let us know!</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Movie Title *
            </Label>
            <Input id="title" name="title" className="col-span-3" required placeholder="e.g. Inception" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Input id="year" name="year" className="col-span-3" placeholder="e.g. 2010" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="details" className="text-right">
              Details
            </Label>
            <Textarea
              id="details"
              name="details"
              className="col-span-3"
              placeholder="Any specific version or language?"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email (Optional)
            </Label>
            <Input id="email" name="email" type="email" className="col-span-3" placeholder="For updates" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
