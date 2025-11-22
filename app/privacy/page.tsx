import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Shield } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Privacy <span className="text-[#00FFFF] glow-cyan">Policy</span>
          </h1>
        </div>

        <p className="text-white/60 text-center mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
            <p className="text-white/80 leading-relaxed">
              At moBix, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our streaming platform. Please read this policy carefully to
              understand our practices regarding your personal data.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <div className="space-y-4 text-white/80">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Personal Information</h3>
                <p className="leading-relaxed">
                  We collect information you provide directly, such as your name, email address, and payment information
                  when you create an account or subscribe to our services.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Usage Data</h3>
                <p className="leading-relaxed">
                  We automatically collect information about your interactions with our platform, including movies
                  watched, search queries, device information, and browsing patterns.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Cookies and Tracking</h3>
                <p className="leading-relaxed">
                  We use cookies and similar technologies to enhance your experience, remember your preferences, and
                  analyze platform usage.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
            <ul className="space-y-2 text-white/80 list-disc list-inside">
              <li>Provide and maintain our streaming services</li>
              <li>Personalize your experience and recommend content</li>
              <li>Process transactions and send related information</li>
              <li>Send you updates, newsletters, and promotional materials</li>
              <li>Improve our platform and develop new features</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Data Sharing and Disclosure</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="space-y-2 text-white/80 list-disc list-inside">
              <li>Service providers who assist in operating our platform</li>
              <li>Payment processors for transaction handling</li>
              <li>Analytics partners to improve our services</li>
              <li>Law enforcement when required by law</li>
              <li>Other parties with your explicit consent</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights and Choices</h2>
            <div className="space-y-3 text-white/80">
              <p className="leading-relaxed">You have the right to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Control cookie preferences</li>
                <li>Request a copy of your data</li>
                <li>Object to certain processing activities</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p className="text-white/80 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
            <p className="text-white/80 leading-relaxed">
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information, please contact us
              immediately.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p className="text-white/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              policy on this page and updating the "Last updated" date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-white/80">
              <p>
                Email:{" "}
                <a href="mailto:privacy@mobix.com" className="text-[#00FFFF] hover:underline">
                  privacy@mobix.com
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
