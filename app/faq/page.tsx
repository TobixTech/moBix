import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ChevronDown } from "lucide-react"

export const metadata = {
  title: "FAQ - Frequently Asked Questions | moBix",
  description: "Find answers to common questions about moBix streaming service, features, and account management.",
}

export default function FAQPage() {
  const faqs = [
    {
      question: "What is moBix?",
      answer:
        "moBix is a premium movie streaming platform that offers a curated collection of movies across all genres. We use smart recommendation technology to help you discover your next favorite film.",
    },
    {
      question: "How do I create an account?",
      answer:
        "Click the 'Sign Up' button in the navigation bar and follow the registration process. You can sign up using your email or Google account.",
    },
    {
      question: "Is moBix free?",
      answer:
        "moBix offers both free and premium tiers. Free users can access a selection of movies with ads, while premium members enjoy ad-free streaming and exclusive content.",
    },
    {
      question: "How does the watchlist feature work?",
      answer:
        "Click the bookmark icon on any movie to add it to your watchlist. You can access your watchlist from your dashboard to quickly find movies you want to watch later.",
    },
    {
      question: "What are smart recommendations?",
      answer:
        "Our smart recommendation engine uses collaborative filtering to analyze your viewing patterns and suggest movies based on what similar users enjoyed. The more you watch, the better the recommendations become.",
    },
    {
      question: "Can I download movies?",
      answer:
        "Selected movies offer download functionality. Look for the download button on the movie detail page to save content for offline viewing.",
    },
    {
      question: "What devices can I use?",
      answer:
        "moBix works on all modern web browsers, smartphones, tablets, and computers. We also offer a Progressive Web App (PWA) that you can install on your device for an app-like experience.",
    },
    {
      question: "How do I report an issue?",
      answer:
        "If you encounter any technical issues or content problems, please contact our support team through the Contact page or email us at support@mobix.com.",
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-16">Find quick answers to common questions about moBix.</p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden group">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#2A2B33]/30 transition-all">
                <h3 className="text-lg font-bold text-white">{faq.question}</h3>
                <ChevronDown className="w-5 h-5 text-[#00FFFF] transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-[#CCCCCC] leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
          <p className="text-[#CCCCCC] mb-6">Can't find the answer you're looking for? We're here to help.</p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all"
          >
            Contact Support
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
