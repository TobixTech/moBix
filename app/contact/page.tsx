import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Mail, MessageSquare, Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          Contact <span className="text-[#00FFFF] glow-cyan">Us</span>
        </h1>

        <p className="text-lg text-white/80 text-center mb-12">
          Have a question or feedback? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Mail className="w-10 h-10 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Email</h3>
            <a href="mailto:support@mobix.com" className="text-white/70 hover:text-[#00FFFF] transition">
              support@mobix.com
            </a>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <Phone className="w-10 h-10 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Phone</h3>
            <p className="text-white/70">+1 (555) 123-4567</p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-6 text-center">
            <MessageSquare className="w-10 h-10 text-[#00FFFF] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Live Chat</h3>
            <p className="text-white/70">Available 24/7</p>
          </div>
        </div>

        <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>

          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-white font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-[#0B0C10] border border-[#2A2B33] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#00FFFF]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-[#0B0C10] border border-[#2A2B33] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#00FFFF]"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-white font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full bg-[#0B0C10] border border-[#2A2B33] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#00FFFF]"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-white font-medium mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full bg-[#0B0C10] border border-[#2A2B33] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#00FFFF]"
                placeholder="Tell us more..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00FFFF] text-[#0B0C10] px-6 py-3 rounded-lg font-bold hover:bg-[#00CCCC] transition"
            >
              Send Message
            </button>
          </form>
        </section>
      </div>

      <Footer />
    </main>
  )
}
