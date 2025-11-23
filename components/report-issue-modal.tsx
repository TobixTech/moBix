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
import { Loader2, AlertTriangle } from "lucide-react"

export function ReportIssueModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      await submitFeedback({
        type: "REPORT",
        title: formData.get("title") as string,
        details: formData.get("details") as string,
        email: formData.get("email") as string,
      })

      toast({
        title: "Issue Reported",
        description: "Thank you for your feedback. We'll look into it shortly.",
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hover:text-[#00FFFF] transition text-left w-full">Report Issue</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1B26] border-[#2A2B33] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Report an Issue
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Found a bug or having trouble? Let us know so we can fix it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Issue Summary</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Video player not loading"
              required
              className="bg-[#0B0C10] border-[#2A2B33]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">Details</Label>
            <Textarea
              id="details"
              name="details"
              placeholder="Describe what happened..."
              className="bg-[#0B0C10] border-[#2A2B33]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Your Email (Optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="For follow-up questions"
              className="bg-[#0B0C10] border-[#2A2B33]"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Report Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
