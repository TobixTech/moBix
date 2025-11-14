export default function MovieDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0B0C10] animate-pulse">
      {/* Navbar Skeleton */}
      <div className="h-16 bg-white/5 border-b border-white/10" />
      
      <div className="px-4 md:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player Skeleton */}
            <div className="aspect-video bg-white/5 rounded-lg mb-6" />
            
            {/* Title Skeleton */}
            <div className="h-10 bg-white/5 rounded w-3/4 mb-4" />
            <div className="h-4 bg-white/5 rounded w-1/2 mb-6" />
            
            {/* Buttons Skeleton */}
            <div className="flex gap-3 mb-8">
              <div className="h-12 bg-white/5 rounded w-32" />
              <div className="h-12 bg-white/5 rounded w-24" />
            </div>
            
            {/* Description Skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
              <div className="h-4 bg-white/5 rounded w-4/6" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="h-64 bg-white/5 rounded-lg mb-6" />
            <div className="h-48 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
