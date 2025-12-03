import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "moBix Privacy Policy - Learn how we collect, use, and protect your personal information when using our movie streaming service.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-[#888888] mb-8">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">1. Introduction</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              Welcome to moBix ("we," "our," or "us"). We respect your privacy and are committed to protecting your
              personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information
              when you use our movie streaming platform.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-[#CCCCCC]">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email address (for account creation and communication)</li>
                  <li>Username and profile information</li>
                  <li>Authentication data (securely stored via Clerk)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Viewing history and preferences</li>
                  <li>Watchlist and liked content</li>
                  <li>Comments and ratings you provide</li>
                  <li>Device information and browser type</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>IP address and approximate location</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Analytics data to improve our service</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-[#CCCCCC]">
              <li>To provide and maintain our streaming service</li>
              <li>To personalize your viewing experience and recommendations</li>
              <li>To process your requests and respond to inquiries</li>
              <li>To send service updates and promotional communications (with consent)</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To improve our platform and develop new features</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">4. Information Sharing</h2>
            <p className="text-[#CCCCCC] mb-4">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#CCCCCC]">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting,
                analytics, authentication)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
              </li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">5. Data Security</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption, secure
              servers, and regular security audits. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">6. Your Rights</h2>
            <p className="text-[#CCCCCC] mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-[#CCCCCC]">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your account and associated data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">7. Cookies</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We use cookies and similar technologies to enhance your experience, remember preferences, and analyze
              usage patterns. You can control cookies through your browser settings, but disabling them may affect
              functionality.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">8. Children's Privacy</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              Our service is not intended for children under 13. We do not knowingly collect personal information from
              children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">9. Contact Us</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p className="text-[#00FFFF] mt-2">mobixmy@gmail.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
