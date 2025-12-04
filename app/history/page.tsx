"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { History, Trash2, Loader, Clock, Play } from "lucide-react"
import { getWatchHistory, clearWatchHistory } from "@/lib/server-actions"
import { useAuth } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import Link from "next/link"
import StarRating from "@/components/star-rating"

interface WatchHistoryItem {
  id: string
  progress: number
  duration: number
  watchedAt: Date
  movie: {
    id: string
    slug?: string
    title: string
    posterUrl: string
    genre: string
    year: number
    averageRating?: string | null
  }
}

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadHistory()
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn])

  const loadHistory = async () => {
    setLoading(true)
    const result = await getWatchHistory()
    if (result.success) {
      setHistory(result.history as WatchHistoryItem[])
    }
    setLoading(false)
  }

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your watch history?")) return

    setClearing(true)
    const result = await clearWatchHistory()
    if (result.success) {
      setHistory([])
    }
    setClearing(false)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00FFFF]/20 flex items-center justify-center">
              <History className="w-6 h-6 text-[#00FFFF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Watch History</h1>
              <p className="text-white/50">Continue where you left off</p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
            >
              {clearing ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Clear History
            </button>
          )}
        </div>

        {!isLoaded || loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-[#00FFFF]" />
          </div>
        ) : !isSignedIn ? (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-12 text-center">
            <History className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Sign in to view history</h3>
            <p className="text-white/50 mb-6">Your watch history will appear here once you sign in.</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-12 text-center">
            <History className="w-16 h-16 text-[#2A2B33] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No watch history yet</h3>
            <p className="text-white/50 mb-6">Start watching movies to track your progress!</p>
            <Link
              href="/home"
              className="inline-block px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/movie/${item.movie.slug || item.movie.id}`}>
                  <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4 hover:border-[#00FFFF]/30 transition-all group">
                    <div className="flex gap-4">
                      {/* Poster */}
                      <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={item.movie.posterUrl || "/placeholder.svg"}
                          alt={item.movie.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Progress overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div className="h-full bg-[#00FFFF]" style={{ width: `${item.progress}%` }} />
                        </div>
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-10 h-10 text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-[#00FFFF] transition">
                          {item.movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                          <span>{item.movie.genre}</span>
                          <span>•</span>
                          <span>{item.movie.year}</span>
                        </div>
                        {item.movie.averageRating && (
                          <StarRating
                            rating={Number.parseFloat(item.movie.averageRating)}
                            size="sm"
                            showValue
                            className="mb-3"
                          />
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-[#00FFFF]">
                            <Clock className="w-4 h-4" />
                            <span>{item.progress}% watched</span>
                          </div>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50">{formatDate(item.watchedAt)}</span>
                        </div>
                      </div>

                      {/* Continue Button */}
                      <div className="hidden sm:flex items-center">
                        <div className="px-4 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition">
                          Continue
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
