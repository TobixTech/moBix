import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Users, Film, Award, Zap } from "lucide-react"

export const metadata = {
  title: "About moBix - Premium Movie Streaming Platform",
  description: "Learn about moBix, your premium destination for streaming the latest movies and entertainment.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">About moBix</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-16 max-w-3xl mx-auto">
          Your premium destination for discovering and streaming the world's best movies and entertainment.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <Film className="w-12 h-12 text-[#00FFFF] mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Our Mission</h3>
            <p className="text-[#CCCCCC] leading-relaxed">
              To provide movie enthusiasts with seamless access to premium content, creating an unparalleled streaming
              experience that connects viewers with stories they love.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <Zap className="w-12 h-12 text-[#00FFFF] mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Our Vision</h3>
            <p className="text-[#CCCCCC] leading-relaxed">
              To become the world's leading movie streaming platform, known for innovation, quality content, and
              exceptional user experience across all devices.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/30 rounded-lg p-12 mb-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Why Choose moBix?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Users className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">Community Driven</h4>
              <p className="text-[#CCCCCC]">Built for movie lovers, by movie lovers</p>
            </div>
            <div>
              <Film className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">Premium Content</h4>
              <p className="text-[#CCCCCC]">Curated collection of the best movies</p>
            </div>
            <div>
              <Award className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">Quality First</h4>
              <p className="text-[#CCCCCC]">HD streaming with optimal performance</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
          <p className="text-[#CCCCCC] leading-relaxed max-w-3xl mx-auto mb-6">
            Founded in 2024, moBix was created with a simple goal: to make premium movie streaming accessible to
            everyone. We believe in the power of stories to inspire, entertain, and connect people across the globe.
          </p>
          <p className="text-[#CCCCCC] leading-relaxed max-w-3xl mx-auto">
            Today, we serve thousands of users worldwide, offering a constantly growing library of movies across all
            genres. Our team is dedicated to improving the platform every day, ensuring you always have the best
            streaming experience possible.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}
