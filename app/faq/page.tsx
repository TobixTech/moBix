import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ChevronDown } from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Find answers to common questions about moBix movie streaming platform. Get help with accounts, streaming, features, and more.",
}

export default function FAQPage() {
  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "Is moBix really free?",
          a: "Yes! moBix is completely free to use. We support the platform through minimal, non-intrusive advertisements. You never need a credit card or subscription.",
        },
        {
          q: "Do I need to create an account?",
          a: "While you can browse and watch movies without an account, creating one unlocks additional features like personal watchlists, liking movies, posting comments, and getting personalized recommendations.",
        },
        {
          q: "How do I sign up?",
          a: "Click the 'Sign Up' button in the navigation bar. You can register with your email address or use Google Sign-In for quick access. After signing up, verify your email to activate all features.",
        },
        {
          q: "Is moBix available in my country?",
          a: "moBix is available globally! Our streaming service can be accessed from anywhere in the world with an internet connection.",
        },
      ],
    },
    {
      category: "Account & Settings",
      questions: [
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot password?' on the login screen, enter your email address, and we'll send you a password reset link. Check your spam folder if you don't see the email within a few minutes.",
        },
        {
          q: "Can I change my email address?",
          a: "Currently, you can update your email through your account settings page. If you encounter issues, contact our support team for assistance.",
        },
        {
          q: "How do I delete my account?",
          a: "To delete your account, please email us at mobixmy@gmail.com with your request. We'll process account deletions within 48 hours and remove all associated data.",
        },
        {
          q: "What does 'Remember me' do?",
          a: "When enabled, 'Remember me' saves your email address for quicker login next time. Your password is never saved - you'll still need to enter it for security.",
        },
      ],
    },
    {
      category: "Streaming & Playback",
      questions: [
        {
          q: "Why isn't the video playing?",
          a: "First, check your internet connection. If that's fine, try: refreshing the page, clearing your browser cache, disabling ad blockers, or trying a different browser. Some videos may have regional restrictions.",
        },
        {
          q: "Can I download movies for offline viewing?",
          a: "Download availability varies by movie. When available, you'll see a download button on the movie page. Note that downloads are for personal use only.",
        },
        {
          q: "What video quality is available?",
          a: "Video quality depends on the source and your internet connection. Most content is available in HD quality. The player automatically adjusts quality based on your connection speed.",
        },
        {
          q: "Why do I see ads before videos?",
          a: "Pre-roll ads help us keep moBix free for everyone. Ads are typically 15-30 seconds and can be skipped after a few seconds. Thank you for your patience!",
        },
      ],
    },
    {
      category: "Features",
      questions: [
        {
          q: "How do I add movies to my watchlist?",
          a: "Click the bookmark/watchlist icon on any movie card or movie page. You must be logged in to use this feature. Access your watchlist from the navigation menu or your dashboard.",
        },
        {
          q: "How can I request a movie?",
          a: "Use the 'Request Movie' button in the navigation bar or footer. Fill out the form with the movie title and any additional details. We review requests regularly and add popular titles when possible.",
        },
        {
          q: "Can I share movies with friends?",
          a: "Yes! Each movie has a share button that lets you share via WhatsApp, Facebook, Twitter, Telegram, Reddit, Email, or copy the link directly.",
        },
        {
          q: "How do I report a broken link or issue?",
          a: "Use the 'Report Issue' button available in the footer or on individual movie pages. Include as much detail as possible so we can fix the problem quickly.",
        },
      ],
    },
    {
      category: "Technical Issues",
      questions: [
        {
          q: "The site is loading slowly. What can I do?",
          a: "Try: clearing your browser cache, disabling browser extensions, checking your internet speed, or using a different browser. Our servers are optimized for fast delivery globally.",
        },
        {
          q: "I'm getting a 404 error on a movie page.",
          a: "This usually means the movie has been removed or the link is outdated. Try searching for the movie by title, or report the issue so we can investigate.",
        },
        {
          q: "Does moBix work on mobile devices?",
          a: "Yes! moBix is fully responsive and works on smartphones and tablets. For the best experience, add moBix to your home screen - it works like a native app!",
        },
        {
          q: "Which browsers are supported?",
          a: "moBix works best on modern browsers: Chrome, Firefox, Safari, Edge, and Opera. We recommend keeping your browser updated for optimal performance and security.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Is my data safe with moBix?",
          a: "Absolutely. We use industry-standard encryption and secure authentication (via Clerk). We never sell your personal data. Read our Privacy Policy for complete details.",
        },
        {
          q: "What data do you collect?",
          a: "We collect: account information (email, username), viewing preferences (watchlist, likes), and basic analytics. This helps us improve the service and personalize your experience.",
        },
        {
          q: "Do you use cookies?",
          a: "Yes, we use cookies for essential functions like keeping you logged in, remembering preferences, and analytics. You can manage cookie settings in your browser.",
        },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="text-[#00FFFF]">Questions</span>
          </h1>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto">
            Find answers to common questions about moBix. Can't find what you're looking for? Contact us!
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.questions.map((item, i) => (
                  <div key={i} className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                        <span className="font-semibold text-white pr-4">{item.q}</span>
                        <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-[#00FFFF] flex-shrink-0" />
                      </summary>
                      <div className="px-5 pb-5 text-[#CCCCCC] leading-relaxed border-t border-[#2A2B33]/50 pt-4">
                        {item.a}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/20 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Still Have Questions?</h3>
          <p className="text-[#888888] mb-6 max-w-lg mx-auto">
            Can't find the answer you're looking for? Our support team is ready to help!
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:bg-[#00CCCC] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
      <Footer />
    </main>
  )
}
