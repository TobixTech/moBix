import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { HelpCircle, Search } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <HelpCircle className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Help <span className="text-[#00FFFF] glow-cyan">Center</span>
          </h1>
        </div>

        <p className="text-lg text-white/80 text-center mb-8">Find answers to common questions about moBix.</p>

        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="search"
              placeholder="Search for help..."
              className="w-full bg-[#1A1B23] border border-[#2A2B33] text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-[#00FFFF]"
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                How do I create an account?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Click the "Sign Up" button in the top right corner, enter your email address and create a password.
                You'll receive a verification email to activate your account.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                What devices can I watch on?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                moBix works on desktop computers, laptops, tablets, and smartphones. Simply visit our website from any
                modern web browser to start watching.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">How do I download movies?</AccordionTrigger>
              <AccordionContent className="text-white/70">
                On the movie detail page, look for the "Download" button below the video player. Click it to access
                download options (available for select titles only).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                How do I save my favorite movies?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Click the heart icon on any movie card or detail page to add it to your favorites. Access your saved
                movies anytime from your profile dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                Why is my video buffering?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Buffering can occur due to slow internet connection. We recommend a minimum of 5 Mbps for standard
                quality and 25 Mbps for HD quality. Try refreshing the page or checking your internet connection.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-white/80 mb-4">Our support team is here to assist you 24/7.</p>
          <a
            href="/contact"
            className="inline-block bg-[#00FFFF] text-[#0B0C10] px-6 py-3 rounded-lg font-bold hover:bg-[#00CCCC] transition"
          >
            Contact Support
          </a>
        </section>
      </div>

      <Footer />
    </main>
  )
}
