import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Mail, MessageSquare, Clock, MapPin } from "lucide-react"
import { ReportIssueModal } from "@/components/report-issue-modal"
import { RequestMovieModal } from "@/components/request-movie-modal"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the moBix team. We're here to help with your questions, feedback, and support requests.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact <span className="text-[#00FFFF]">Us</span>
          </h1>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto">
            Have questions, feedback, or need help? We'd love to hear from you. Our team is here to assist.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#00FFFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Email</h3>
                    <p className="text-[#888888]">For general inquiries and support</p>
                    <a href="mailto:mobixmy@gmail.com" className="text-[#00FFFF] hover:underline">
                      mobixmy@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#00FFFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Response Time</h3>
                    <p className="text-[#888888]">We typically respond within 24-48 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#00FFFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Location</h3>
                    <p className="text-[#888888]">Operating globally, serving users worldwide</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              <p className="text-[#888888] mb-6">Use these shortcuts for common requests:</p>

              <div className="space-y-3">
                <RequestMovieModal
                  trigger={
                    <button className="w-full py-3 px-4 bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] rounded-lg hover:bg-[#00FFFF]/20 transition-colors flex items-center gap-3">
                      <MessageSquare className="w-5 h-5" />
                      Request a Movie
                    </button>
                  }
                />

                <ReportIssueModal />
              </div>
            </div>
          </div>

          {/* FAQ Preview */}
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {[
                {
                  q: "Is moBix free to use?",
                  a: "Yes! moBix is completely free. We support the platform through minimal advertisements.",
                },
                {
                  q: "How do I report a broken video link?",
                  a: "Use the 'Report Issue' button on the movie page or in our quick actions above.",
                },
                {
                  q: "Can I request specific movies?",
                  a: "Use the 'Request a Movie' feature and we'll try to add it to our library.",
                },
                {
                  q: "How do I delete my account?",
                  a: "Contact us via email and we'll process your request within 48 hours.",
                },
                {
                  q: "Do you have a mobile app?",
                  a: "moBix works as a Progressive Web App (PWA). Add it to your home screen for an app-like experience!",
                },
              ].map((item, i) => (
                <div key={i} className="border-b border-[#2A2B33] pb-4 last:border-0 last:pb-0">
                  <h3 className="text-white font-semibold mb-1">{item.q}</h3>
                  <p className="text-[#888888] text-sm">{item.a}</p>
                </div>
              ))}
            </div>

            <a href="/faq" className="inline-block mt-6 text-[#00FFFF] hover:underline">
              View all FAQs →
            </a>
          </div>
        </div>

        {/* Support Notice */}
        <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#00CCCC]/10 border border-[#00FFFF]/20 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Need Urgent Help?</h3>
          <p className="text-[#888888]">
            For critical issues affecting your account or service access, please include "URGENT" in your email subject
            line and we'll prioritize your request.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
