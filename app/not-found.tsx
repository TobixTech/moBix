import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-[#00FFFF] mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Movie Not Found</h2>
        <p className="text-white/60 mb-8 max-w-md">
          The movie you're looking for doesn't exist or may have been removed from the platform.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
