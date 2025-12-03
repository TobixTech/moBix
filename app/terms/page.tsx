import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "moBix Terms of Service - Read the terms and conditions for using our movie streaming platform.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-[#888888] mb-8">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              By accessing or using moBix ("the Service"), you agree to be bound by these Terms of Service. If you do
              not agree to these terms, please do not use our platform. We reserve the right to modify these terms at
              any time, and continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">2. Description of Service</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              moBix is a free movie streaming platform that allows users to browse, search, and watch movies online. We
              provide content aggregation services and do not host video content directly. Features include user
              accounts, watchlists, likes, comments, and personalized recommendations.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">3. User Accounts</h2>
            <div className="space-y-4 text-[#CCCCCC]">
              <p>When creating an account, you agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not create multiple accounts or share account access</li>
              </ul>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">4. Acceptable Use</h2>
            <p className="text-[#CCCCCC] mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-[#CCCCCC]">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload or transmit viruses or malicious code</li>
              <li>Scrape, copy, or redistribute content without permission</li>
              <li>Use automated systems to access the Service excessively</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate others or provide false information</li>
              <li>Circumvent any technological protection measures</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">5. Content & Intellectual Property</h2>
            <div className="space-y-4 text-[#CCCCCC]">
              <p>
                All content available through moBix, including but not limited to movies, images, logos, and user
                interface designs, is protected by copyright and other intellectual property laws.
              </p>
              <p>
                <strong>User-Generated Content:</strong> By posting comments, ratings, or other content, you grant moBix
                a non-exclusive, royalty-free license to use, display, and distribute such content on our platform.
              </p>
              <p>
                <strong>Copyright Concerns:</strong> If you believe content infringes your copyright, please contact us
                at mobixmy@gmail.com with details of the alleged infringement.
              </p>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">6. Advertisements</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              moBix is supported by advertisements. By using our Service, you consent to the display of ads. We strive
              to keep ads non-intrusive, but we are not responsible for the content of third-party advertisements. Ad
              blockers may affect Service functionality.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE
              DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE ARE NOT RESPONSIBLE FOR
              THE ACCURACY, RELIABILITY, OR AVAILABILITY OF CONTENT.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">8. Limitation of Liability</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, MOBIX AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, REGARDLESS
              OF THE CAUSE OF ACTION OR THE BASIS OF THE CLAIM.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">9. Termination</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for
              violations of these Terms or any other reason. Upon termination, your right to use the Service ceases
              immediately, and we may delete your account data.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">10. Governing Law</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising
              from these Terms or your use of the Service shall be resolved through binding arbitration or in courts of
              competent jurisdiction.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-6">
            <h2 className="text-2xl font-bold text-[#00FFFF] mb-4">11. Contact Information</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-[#00FFFF] mt-2">mobixmy@gmail.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
