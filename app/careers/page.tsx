import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Briefcase, Heart, Code, Rocket } from "lucide-react"

export const metadata = {
  title: "Careers at moBix - Join Our Team",
  description: "Join the moBix team and help shape the future of movie streaming.",
}

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Full-Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Content Curator",
      department: "Content",
      location: "Hybrid",
      type: "Full-time",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">Join Our Team</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-16 max-w-3xl mx-auto">
          Help us build the future of movie streaming. We're looking for passionate individuals to join our growing
          team.
        </p>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Briefcase className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Remote First</h4>
            <p className="text-[#CCCCCC] text-sm">Work from anywhere</p>
          </div>
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Heart className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Health Benefits</h4>
            <p className="text-[#CCCCCC] text-sm">Comprehensive coverage</p>
          </div>
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Code className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Latest Tech</h4>
            <p className="text-[#CCCCCC] text-sm">Modern tech stack</p>
          </div>
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Rocket className="w-10 h-10 text-[#00FFFF] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Growth</h4>
            <p className="text-[#CCCCCC] text-sm">Career development</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-8">Open Positions</h2>
        <div className="space-y-4">
          {openings.map((job, index) => (
            <div
              key={index}
              className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 hover:border-[#00FFFF] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-[#CCCCCC]">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <button className="mt-4 md:mt-0 px-6 py-2 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/30 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Don't see your role?</h3>
          <p className="text-[#CCCCCC] mb-6">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future
            opportunities.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all">
            Send Resume
          </button>
        </div>
      </div>

      <Footer />
    </main>
  )
}
