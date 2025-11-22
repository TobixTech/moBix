import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Newspaper, Download, Mail } from "lucide-react"

export const metadata = {
  title: "Press & Media - moBix",
  description: "Press releases, media kit, and contact information for journalists and media professionals.",
}

export default function PressPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">Press & Media</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-16">
          Resources and information for journalists and media professionals.
        </p>

        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-12">
          <Newspaper className="w-12 h-12 text-[#00FFFF] mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Latest Press Release</h2>
          <h3 className="text-xl text-white mb-2">moBix Launches Smart Recommendation Engine</h3>
          <p className="text-[#888888] mb-4">December 15, 2024</p>
          <p className="text-[#CCCCCC] leading-relaxed mb-4">
            moBix today announced the launch of its revolutionary Smart Recommendation Engine, powered by collaborative
            filtering technology. This new feature analyzes user viewing patterns and preferences to deliver
            personalized movie recommendations that get smarter over time.
          </p>
          <p className="text-[#CCCCCC] leading-relaxed">
            "We're committed to helping users discover their next favorite movie," said the moBix team. "Our Smart
            Recommendation Engine represents a major leap forward in personalized streaming experiences."
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <Download className="w-10 h-10 text-[#00FFFF] mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Media Kit</h3>
            <p className="text-[#CCCCCC] mb-4">Download our official logos, brand guidelines, and press materials.</p>
            <button className="px-6 py-2 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF] rounded-lg font-bold hover:bg-[#00FFFF]/30 transition-all">
              Download Kit
            </button>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <Mail className="w-10 h-10 text-[#00FFFF] mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Media Inquiries</h3>
            <p className="text-[#CCCCCC] mb-4">Get in touch with our press team for interviews and information.</p>
            <a
              href="mailto:press@mobix.com"
              className="inline-block px-6 py-2 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF] rounded-lg font-bold hover:bg-[#00FFFF]/30 transition-all"
            >
              Contact Press Team
            </a>
          </div>
        </div>

        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Company Facts</h2>
          <div className="grid md:grid-cols-2 gap-6 text-[#CCCCCC]">
            <div>
              <h4 className="font-bold text-white mb-2">Founded</h4>
              <p>2024</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Headquarters</h4>
              <p>Global (Remote-first)</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Industry</h4>
              <p>Entertainment & Media Streaming</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Platform</h4>
              <p>Web, Mobile, Progressive Web App</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
