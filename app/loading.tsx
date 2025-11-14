export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-white text-xl font-bold mb-2">Loading moBix</h2>
        <p className="text-white/60">Please wait while we load your content...</p>
      </div>
    </div>
  )
}
