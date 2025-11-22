import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Film, Heart, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          About <span className="text-[#00FFFF] glow-cyan">moBix</span>
        </h1>

        <div className="prose prose-invert max-w-none">
          <section className="mb-12">
            <p className="text-lg text-white/80 text-center mb-12">
              moBix is your premium destination for streaming the latest movies and shows. We're committed to delivering
              high-quality entertainment directly to your screen.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
                <Film className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Extensive Library</h3>
                <p className="text-white/70">
                  Access thousands of movies across all genres, from action to Nollywood classics.
                </p>
              </div>

              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-white/70">
                  Experience smooth streaming with our optimized delivery network and caching system.
                </p>
              </div>

              <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
                <Heart className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">User Focused</h3>
                <p className="text-white/70">
                  Built with you in mind - save favorites, leave reviews, and discover new content.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-white/80 leading-relaxed">
              At moBix, we believe entertainment should be accessible, high-quality, and enjoyable for everyone. Our
              mission is to provide a seamless streaming experience that brings people together through the power of
              storytelling. Whether you're looking for the latest blockbuster or a hidden gem, we're here to help you
              discover your next favorite movie.
            </p>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Join Our Community</h2>
            <p className="text-white/80 mb-6">
              Become part of the moBix family today and start enjoying unlimited entertainment.
            </p>
            <a
              href="/auth"
              className="inline-block bg-[#00FFFF] text-[#0B0C10] px-8 py-3 rounded-lg font-bold hover:bg-[#00CCCC] transition"
            >
              Get Started
            </a>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
