import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <FileText className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Terms of <span className="text-[#00FFFF] glow-cyan">Service</span>
          </h1>
        </div>

        <p className="text-white/60 text-center mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
            <p className="text-white/80 leading-relaxed">
              By accessing or using moBix, you agree to be bound by these Terms of Service. If you disagree with any
              part of these terms, you may not access the service.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Use of Service</h2>
            <div className="space-y-4 text-white/80">
              <p className="leading-relaxed">You agree to use moBix only for lawful purposes. You must not:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to circumvent security measures</li>
                <li>Upload malicious code or viruses</li>
                <li>Scrape or harvest data from the platform</li>
                <li>Impersonate others or misrepresent your identity</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Account Registration</h2>
            <p className="text-white/80 leading-relaxed">
              You must provide accurate and complete information when creating an account. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities under your account.
              Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Content and Intellectual Property</h2>
            <div className="space-y-4 text-white/80">
              <p className="leading-relaxed">
                All content on moBix, including movies, shows, graphics, logos, and software, is owned by moBix or its
                content suppliers and is protected by copyright and other intellectual property laws.
              </p>
              <p className="leading-relaxed">
                You are granted a limited, non-exclusive, non-transferable license to access and view the content for
                personal, non-commercial use only.
              </p>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">User Content</h2>
            <p className="text-white/80 leading-relaxed">
              When you post reviews, comments, or other content, you grant moBix a worldwide, non-exclusive,
              royalty-free license to use, reproduce, modify, and display such content. You represent that you own or
              have the necessary rights to the content you submit.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Subscriptions and Payments</h2>
            <div className="space-y-4 text-white/80">
              <p className="leading-relaxed">
                Premium subscriptions automatically renew unless canceled before the renewal date. You authorize us to
                charge your payment method for the subscription fee.
              </p>
              <p className="leading-relaxed">
                Refunds are handled on a case-by-case basis. Contact support for refund requests.
              </p>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <p className="text-white/80 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms or for
              any other reason we deem appropriate. Upon termination, your right to use the service will immediately
              cease.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Disclaimer of Warranties</h2>
            <p className="text-white/80 leading-relaxed">
              moBix is provided "as is" without warranties of any kind, either express or implied. We do not guarantee
              that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p className="text-white/80 leading-relaxed">
              To the fullest extent permitted by law, moBix shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the service.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
            <p className="text-white/80 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email
              or through the platform. Continued use of the service after changes constitutes acceptance of the new
              Terms.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-white/80">
              <p>
                Email:{" "}
                <a href="mailto:legal@mobix.com" className="text-[#00FFFF] hover:underline">
                  legal@mobix.com
                </a>
              </p>
              <p>Address: 123 Streaming Ave, Tech City, TC 12345</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
