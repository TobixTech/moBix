import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Mail, MessageSquare, Send } from "lucide-react"

export const metadata = {
  title: "Contact Us - moBix Support",
  description: "Get in touch with the moBix team. We're here to help with any questions or concerns.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-6 text-center">Contact Us</h1>
        <p className="text-xl text-[#CCCCCC] text-center mb-16">Have a question or need support? We're here to help.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <Mail className="w-10 h-10 text-[#00FFFF] mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-[#CCCCCC] mb-3">Get a response within 24 hours</p>
            <a href="mailto:support@mobix.com" className="text-[#00FFFF] hover:underline">
              support@mobix.com
            </a>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6">
            <MessageSquare className="w-10 h-10 text-[#00FFFF] mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
            <p className="text-[#CCCCCC] mb-3">Available 9 AM - 5 PM EST</p>
            <button className="text-[#00FFFF] hover:underline">Start Chat</button>
          </div>
        </div>

        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">First Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Subject</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Message</label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all resize-none"
                placeholder="Tell us more about your question or concern..."
              />
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  )
}
