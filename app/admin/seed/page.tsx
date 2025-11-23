"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Database, Check, AlertCircle, Loader, ArrowLeft } from "lucide-react"
import { seedDatabase } from "@/lib/server-actions"
import Link from "next/link"

export default function SeedDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    inserted?: number
    skipped?: number
    error?: string
  } | null>(null)
  const router = useRouter()

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    const response = await seedDatabase()
    setResult(response)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-[#00FFFF] hover:text-[#00CCCC] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                <Database className="w-12 h-12 text-[#00FFFF]" />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
              Seed Database
            </h1>
            <p className="text-[#888888] text-sm">Populate your database with sample movies and settings</p>
          </div>

          {result && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                result.success
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-red-500/20 border-red-500/50 text-red-400"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{result.message || result.error}</p>
                  {result.success && (
                    <p className="text-sm mt-1 opacity-80">
                      {result.inserted} new movies added, {result.skipped} already existed
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg p-6 mb-6">
            <h2 className="text-white font-semibold mb-3">What will be seeded:</h2>
            <ul className="text-[#888888] space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF]" />8 Popular movies with sample data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF]" />
                Default ad settings configuration
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF]" />
                Skips any movies that already exist
              </li>
            </ul>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Seeding Database...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Start Seeding</span>
              </>
            )}
          </button>

          {result?.success && (
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-full mt-3 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] text-white font-medium rounded-lg hover:border-[#00FFFF]/50 transition-all"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
