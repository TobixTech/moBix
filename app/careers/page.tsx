import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Briefcase, Users, TrendingUp } from "lucide-react"

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          Careers at <span className="text-[#00FFFF] glow-cyan">moBix</span>
        </h1>

        <p className="text-lg text-white/80 text-center mb-12">
          Join our team and help shape the future of entertainment streaming.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Briefcase className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Challenging Work</h3>
            <p className="text-white/70">Work on cutting-edge streaming technology and solve complex problems.</p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Great Team</h3>
            <p className="text-white/70">
              Collaborate with talented individuals who are passionate about entertainment.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <TrendingUp className="w-12 h-12 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Growth Opportunities</h3>
            <p className="text-white/70">
              Advance your career with mentorship, training, and leadership opportunities.
            </p>
          </div>
        </div>

        <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Open Positions</h2>
          <div className="space-y-4">
            <div className="border-b border-[#2A2B33] pb-4">
              <h3 className="text-xl font-bold text-white mb-2">Full-Stack Engineer</h3>
              <p className="text-white/70 mb-2">
                Help build and scale our streaming platform with Next.js and Node.js.
              </p>
              <span className="text-[#00FFFF] text-sm">Remote • Full-time</span>
            </div>

            <div className="border-b border-[#2A2B33] pb-4">
              <h3 className="text-xl font-bold text-white mb-2">DevOps Engineer</h3>
              <p className="text-white/70 mb-2">
                Optimize our infrastructure and ensure 99.9% uptime for millions of users.
              </p>
              <span className="text-[#00FFFF] text-sm">Remote • Full-time</span>
            </div>

            <div className="pb-4">
              <h3 className="text-xl font-bold text-white mb-2">Content Manager</h3>
              <p className="text-white/70 mb-2">Curate and manage our growing library of movies and shows.</p>
              <span className="text-[#00FFFF] text-sm">Hybrid • Full-time</span>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Interested in Joining?</h2>
          <p className="text-white/80 mb-6">
            Send your resume and portfolio to{" "}
            <a href="mailto:careers@mobix.com" className="text-[#00FFFF] hover:underline">
              careers@mobix.com
            </a>
          </p>
        </section>
      </div>

      <Footer />
    </main>
  )
}
