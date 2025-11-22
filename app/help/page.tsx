import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Search, HelpCircle, BookOpen, MessageCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Help Center - moBix Support",
  description: "Get help and support for using moBix. Find answers to common questions and troubleshooting guides.",
}

export default function HelpPage() {
  const categories = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Getting Started",
      description: "Learn the basics of using moBix",
      articles: 12,
    },
    {
      icon: <HelpCircle className="w-8 h-8" />,
      title: "Account & Billing",
      description: "Manage your account and subscription",
      articles: 8,
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Streaming Issues",
      description: "Troubleshoot playback problems",
      articles: 15,
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Features",
      description: "Explore moBix features and tools",
      articles: 10,
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">Help Center</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-12">
          Find answers and get support for your moBix experience.
        </p>

        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#888888]" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-[#1A1B23] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 hover:border-[#00FFFF] transition-all cursor-pointer"
            >
              <div className="text-[#00FFFF] mb-4">{category.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
              <p className="text-[#CCCCCC] mb-3">{category.description}</p>
              <p className="text-[#888888] text-sm">{category.articles} articles</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-[#CCCCCC] mb-6">Can't find what you're looking for? Our support team is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="px-8 py-3 bg-[#1A1B23] text-white border border-[#2A2B33] rounded-lg font-bold hover:border-[#00FFFF] transition-all"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
