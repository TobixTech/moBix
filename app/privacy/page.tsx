import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - moBix",
  description: "moBix privacy policy. Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-5xl font-bold text-white">Privacy Policy</h1>
        </div>
        <p className="text-[#888888] text-center mb-12">Last updated: December 15, 2024</p>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">
              We collect information you provide directly to us, including your name, email address, and payment
              information when you create an account or subscribe to our services.
            </p>
            <p className="text-[#CCCCCC] leading-relaxed">
              We also automatically collect certain information about your device when you use moBix, including your IP
              address, browser type, operating system, and viewing preferences.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-[#CCCCCC] space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send you related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Provide personalized content and recommendations</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information
              with service providers who assist us in operating our platform, conducting our business, or serving our
              users, as long as those parties agree to keep this information confidential.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-[#CCCCCC] space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to our use of your information</li>
              <li>Request that we transfer your information to another service</li>
            </ul>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@mobix.com
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
