"use client"

import Link from "next/link"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflineClientPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
          <WifiOff className="w-10 h-10 text-white/60" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">You're Offline</h1>

        <p className="text-white/60 mb-8">
          It looks like you've lost your internet connection. Check your connection and try again to continue streaming.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        <p className="text-white/40 text-sm mt-8">Some content may still be available from your cache.</p>
      </div>
    </main>
  )
}
