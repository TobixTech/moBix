"use client"
import { useState } from "react"
import Navbar from "@/components/navbar"
import HeroBanner from "@/components/hero-banner"
import MovieCarousel from "@/components/movie-carousel"
import AdBanner from "@/components/ad-banner"
import Footer from "@/components/footer"
import AuthModal from "@/components/auth-modal"

export default function PublicHomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} onAuthClick={() => setShowAuthModal(true)} />
      <HeroBanner />

      <div className="px-4 md:px-8 py-8 space-y-12">
        <div>
          <MovieCarousel title="Trending Now" />
          <AdBanner type="horizontal" className="my-8" />
        </div>

        <div>
          <MovieCarousel title="Recently Added" />
          <AdBanner type="horizontal" className="my-8" />
        </div>

        <div>
          <MovieCarousel title="Action & Adventure" />
          <AdBanner type="horizontal" className="my-8" />
        </div>

        <div>
          <MovieCarousel title="Drama & Romance" />
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <Footer />
    </main>
  )
}
