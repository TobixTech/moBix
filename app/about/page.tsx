import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Film, Users, Globe, Heart, Shield, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about moBix - your ultimate destination for free movie streaming. Discover our mission, values, and commitment to bringing you the best entertainment.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About <span className="text-[#00FFFF]">moBix</span>
          </h1>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto">
            Your ultimate destination for cinematic entertainment. We're passionate about movies and dedicated to
            bringing you the best streaming experience.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-[#CCCCCC] leading-relaxed mb-4">
                At moBix, we believe everyone deserves access to quality entertainment. Our mission is to provide a
                seamless, free streaming platform that connects movie lovers with the content they love, without
                barriers.
              </p>
              <p className="text-[#CCCCCC] leading-relaxed">
                We curate a diverse collection of films spanning genres, eras, and cultures - from Hollywood
                blockbusters to independent gems and Nollywood classics.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-[#00FFFF]/20 to-transparent rounded-full flex items-center justify-center">
                <Film className="w-24 h-24 text-[#00FFFF]" />
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Users,
              title: "Community First",
              description:
                "We build for our users. Every feature, every update is designed with your viewing experience in mind.",
            },
            {
              icon: Globe,
              title: "Global Access",
              description:
                "Movies transcend borders. We bring content from around the world to your screen, wherever you are.",
            },
            {
              icon: Heart,
              title: "Passion for Film",
              description: "Our team is made up of movie enthusiasts who understand and share your love for cinema.",
            },
            {
              icon: Shield,
              title: "Safe & Secure",
              description:
                "Your privacy matters. We employ industry-standard security to protect your data and viewing habits.",
            },
            {
              icon: Zap,
              title: "Always Improving",
              description:
                "We continuously enhance our platform based on user feedback to deliver the best experience.",
            },
            {
              icon: Film,
              title: "Quality Content",
              description:
                "We focus on quality over quantity, ensuring every title in our library meets our standards.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6 hover:border-[#00FFFF]/50 transition-colors"
            >
              <div className="w-12 h-12 bg-[#00FFFF]/10 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-[#888888]">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/20 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "1000+", label: "Movies Available" },
              { value: "50K+", label: "Active Users" },
              { value: "100+", label: "Countries Reached" },
              { value: "24/7", label: "Streaming Uptime" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-[#00FFFF] mb-1">{stat.value}</div>
                <div className="text-[#888888] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built with Love</h2>
          <p className="text-[#888888] max-w-2xl mx-auto mb-8">
            moBix is created by a dedicated team of developers and movie enthusiasts who believe in making entertainment
            accessible to everyone. We're constantly working to improve your experience.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:bg-[#00CCCC] transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </div>
      <Footer />
    </main>
  )
}
