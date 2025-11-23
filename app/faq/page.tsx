import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ChevronDown } from "lucide-react"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 px-4 md:px-8 max-w-3xl mx-auto text-white">
        <h1 className="text-4xl font-bold mb-8 text-[#00FFFF] text-center">Frequently Asked Questions</h1>

        <div className="space-y-4">
          {[
            {
              q: "Is moBix really free?",
              a: "Yes! moBix is completely free to use. We support the platform through minimal, non-intrusive advertisements.",
            },
            {
              q: "Do I need to create an account?",
              a: "While you can browse movies without an account, creating one allows you to create a watchlist, like movies, and post comments.",
            },
            {
              q: "How can I request a movie?",
              a: "You can use the 'Request Movie' button in the navigation menu to submit requests for movies you'd like to see added to our library.",
            },
            {
              q: "Why isn't the video playing?",
              a: "Please ensure you have a stable internet connection. If the issue persists, try clearing your browser cache or using a different browser. You can also report broken links using the report feature.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-lg">{item.q}</span>
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-[#00FFFF]" />
                </summary>
                <div className="px-6 pb-6 text-[#CCCCCC] leading-relaxed border-t border-[#2A2B33]/50 pt-4">
                  {item.a}
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
