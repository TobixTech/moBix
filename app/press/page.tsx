import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Newspaper } from "lucide-react"

export default function PressPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Newspaper className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Press & <span className="text-[#00FFFF] glow-cyan">Media</span>
          </h1>
        </div>

        <p className="text-lg text-white/80 text-center mb-12">
          Latest news, announcements, and media resources from moBix.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recent News</h2>

          <div className="space-y-6">
            <article className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
              <time className="text-[#00FFFF] text-sm">January 15, 2025</time>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">moBix Launches Advanced Caching System</h3>
              <p className="text-white/70">
                We're excited to announce the launch of our new Redis-powered caching system, delivering lightning-fast
                content delivery and improved user experience for millions of viewers worldwide.
              </p>
            </article>

            <article className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
              <time className="text-[#00FFFF] text-sm">December 20, 2024</time>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">Expanding Nollywood Content Library</h3>
              <p className="text-white/70">
                moBix continues to grow its Nollywood collection, adding 100+ new titles from Nigeria's thriving film
                industry, celebrating African storytelling and culture.
              </p>
            </article>

            <article className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
              <time className="text-[#00FFFF] text-sm">November 10, 2024</time>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">moBix Platform Launch</h3>
              <p className="text-white/70">
                Today marks the official launch of moBix, bringing premium streaming entertainment to audiences
                everywhere with a focus on quality, speed, and user experience.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Media Contact</h2>
          <p className="text-white/80 mb-4">
            For press inquiries, interviews, or media resources, please contact our communications team:
          </p>
          <div className="space-y-2 text-white/80">
            <p>
              Email:{" "}
              <a href="mailto:press@mobix.com" className="text-[#00FFFF] hover:underline">
                press@mobix.com
              </a>
            </p>
            <p>Phone: +1 (555) 123-4567</p>
          </div>
        </section>

        <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Brand Assets</h2>
          <p className="text-white/80 mb-4">
            Download our official logos, brand guidelines, and media kit for use in your publications.
          </p>
          <button className="bg-[#00FFFF] text-[#0B0C10] px-6 py-2 rounded-lg font-bold hover:bg-[#00CCCC] transition">
            Download Media Kit
          </button>
        </section>
      </div>

      <Footer />
    </main>
  )
}
