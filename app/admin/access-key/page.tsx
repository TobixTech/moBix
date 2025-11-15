"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

export default function AdminAccessKeyPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin dashboard immediately
    router.replace("/admin/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
        <p className="text-white/60">Redirecting to admin dashboard...</p>
      </div>
    </div>
  )
}
