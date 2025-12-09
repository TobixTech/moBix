"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { CreatorDashboard } from "@/components/creator-dashboard"
import { CreatorRequestCard } from "@/components/creator-request-card"
import { getCreatorStatus } from "@/lib/creator-actions"
import { Video, Sparkles } from "lucide-react"
import Link from "next/link"

export default function CreatorPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [creatorStatus, setCreatorStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      fetchCreatorStatus()
    }
  }, [isLoaded])

  const fetchCreatorStatus = async () => {
    const result = await getCreatorStatus()
    setCreatorStatus(result)
    setLoading(false)
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#00FFFF]/20 border-t-[#00FFFF] rounded-full animate-spin" />
            <Video className="w-6 h-6 text-[#00FFFF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white/70">Loading Creator Studio...</p>
        </div>
      </main>
    )
  }

  if (!clerkUser) {
    return (
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar />
        <div className="pt-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Video className="w-16 h-16 text-[#00FFFF] mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in Required</h1>
          <p className="text-white/60 mb-6 text-center">You need to sign in to access Creator Studio</p>
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
          >
            Sign In
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    )
  }

  if (!creatorStatus?.isCreatorSystemEnabled) {
    return (
      <main className="min-h-screen bg-[#0B0C10]">
        <Navbar />
        <div className="pt-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Video className="w-16 h-16 text-white/20 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Creator System Unavailable</h1>
          <p className="text-white/60 mb-6 text-center">The creator program is currently not accepting new creators.</p>
          <Link
            href="/home"
            className="px-6 py-3 bg-[#1A1B23] border border-[#2A2B33] text-white rounded-lg hover:bg-[#2A2B33] transition"
          >
            Go Home
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    )
  }

  // Show creator dashboard for approved creators
  if (creatorStatus?.isCreator && creatorStatus?.status === "approved") {
    return (
      <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
        <Navbar />
        <CreatorDashboard profile={creatorStatus.profile} onRefresh={fetchCreatorStatus} />
        <Footer />
        <MobileBottomNav />
      </main>
    )
  }

  // Show request card for non-creators
  return (
    <main className="min-h-screen bg-[#0B0C10] pb-20 md:pb-0">
      <Navbar />
      <div className="pt-24 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#00FFFF]/20 to-purple-500/20 mb-4">
              <Sparkles className="w-10 h-10 text-[#00FFFF]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Creator Studio</h1>
            <p className="text-white/60">Share your movies and series with the moBix community</p>
          </div>

          <CreatorRequestCard
            status={creatorStatus?.status}
            rejectionReason={creatorStatus?.rejectionReason}
            requestedAt={creatorStatus?.requestedAt}
            accountAgeDays={creatorStatus?.accountAgeDays}
            minAgeDays={creatorStatus?.minAgeDays}
            maxAgeDays={creatorStatus?.maxAgeDays}
            isEligible={creatorStatus?.isEligible}
            onRequestSubmitted={fetchCreatorStatus}
          />
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  )
}
