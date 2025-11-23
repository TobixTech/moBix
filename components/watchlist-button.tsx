"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, Check } from "lucide-react"
import { toggleWatchlist } from "@/lib/server-actions"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface WatchlistButtonProps {
  movieId: string
  initialStatus: boolean
}

export function WatchlistButton({ movieId, initialStatus }: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleToggle() {
    setLoading(true)
    try {
      const result = await toggleWatchlist(movieId)
      setInWatchlist(result.added)
      toast({
        title: result.added ? "Added to Watchlist" : "Removed from Watchlist",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update watchlist",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "rounded-full px-6 py-3 text-lg transition-all",
        inWatchlist && "bg-secondary text-secondary-foreground border-secondary",
      )}
    >
      {inWatchlist ? (
        <>
          <Check className="w-5 h-5 mr-2" />
          In Watchlist
        </>
      ) : (
        <>
          <Bookmark className="w-5 h-5 mr-2" />
          Add to Watchlist
        </>
      )}
    </Button>
  )
}
