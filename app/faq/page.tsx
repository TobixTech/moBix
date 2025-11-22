import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { MessageCircleQuestion } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <MessageCircleQuestion className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Frequently Asked <span className="text-[#00FFFF] glow-cyan">Questions</span>
          </h1>
        </div>

        <p className="text-lg text-white/80 text-center mb-12">Quick answers to questions you may have.</p>

        <section>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">Is moBix free to use?</AccordionTrigger>
              <AccordionContent className="text-white/70">
                moBix offers both free and premium content. Create a free account to access our library of movies and
                shows with ads. Premium subscriptions are coming soon!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">Can I watch offline?</AccordionTrigger>
              <AccordionContent className="text-white/70">
                Select movies offer a download option. Look for the download button on the movie page. Downloaded
                content can be watched offline for up to 30 days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                How many devices can I use?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                You can watch moBix on unlimited devices with one account. Stream on your phone, tablet, laptop, or
                desktop - all with the same login.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                What video quality is available?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                We offer streaming in SD, HD (720p), and Full HD (1080p) depending on your internet speed and device
                capability. The video quality adjusts automatically for the best experience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                How do I cancel my account?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                You can delete your account anytime from your profile settings. Go to Settings {">"} Account {">"}{" "}
                Delete Account. All your data will be permanently removed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                Are new movies added regularly?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Yes! We add new movies and shows every week. Follow us on social media or check the "Recently Added"
                section to stay updated on the latest content.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                How do I report a problem?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                If you encounter any issues, please contact our support team through the Contact page or email us at
                support@mobix.com. We typically respond within 24 hours.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg px-6">
              <AccordionTrigger className="text-white hover:text-[#00FFFF]">
                Can I request specific movies?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                We love hearing from our community. Send your movie requests to content@mobix.com and we'll do our best
                to add them to our library.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-12 bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
          <p className="text-white/80 mb-6">Our support team is ready to help you.</p>
          <a
            href="/contact"
            className="inline-block bg-[#00FFFF] text-[#0B0C10] px-8 py-3 rounded-lg font-bold hover:bg-[#00CCCC] transition"
          >
            Contact Support
          </a>
        </section>
      </div>

      <Footer />
    </main>
  )
}
