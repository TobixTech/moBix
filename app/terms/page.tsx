import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { FileText } from "lucide-react"

export const metadata = {
  title: "Terms of Service - moBix",
  description: "moBix Terms of Service. Read our terms and conditions for using the platform.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <FileText className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-5xl font-bold text-white">Terms of Service</h1>
        </div>
        <p className="text-[#888888] text-center mb-12">Last updated: December 15, 2024</p>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              By accessing and using moBix, you accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to these terms, you should not use this service.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">
              moBix grants you a personal, non-exclusive, non-transferable license to access and use the service for
              your personal, non-commercial use.
            </p>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-[#CCCCCC] space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept
              responsibility for all activities that occur under your account.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Content</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              All content provided on moBix is for informational and entertainment purposes only. We do not guarantee
              the accuracy, completeness, or usefulness of any information provided.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              moBix shall not be liable for any indirect, incidental, special, consequential or punitive damages
              resulting from your use of or inability to use the service.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Termination</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We may terminate or suspend your account and access to the service immediately, without prior notice or
              liability, for any reason whatsoever, including breach of these Terms.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Changes to Terms</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. Continued use of the service after any
              such changes constitutes your consent to such changes.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
