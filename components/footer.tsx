import Link from "next/link"
import { ReportIssueModal } from "@/components/report-issue-modal"

export default function Footer() {
  return (
    <footer className="bg-[#0B0C10] border-t border-[#2A2B33] mt-16">
      <div className="px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-[#00FFFF] mb-4 glow-cyan">moBix</h3>
            <p className="text-[#888888] text-sm">Premium streaming platform for movies and shows.</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-[#888888] text-sm">
              <li>
                <Link href="/about" className="hover:text-[#00FFFF] transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#00FFFF] transition">
                  A
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#00FFFF] transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-[#888888] text-sm">
              <li>
                <Link href="/contact" className="hover:text-[#00FFFF] transition">
                  Help Center
                </Link>
              </li>
              <li>
                <ReportIssueModal />
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#00FFFF] transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-[#888888] text-sm">
              <li>
                <Link href="/privacy" className="hover:text-[#00FFFF] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#00FFFF] transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2A2B33] pt-8 text-center text-[#888888] text-sm">
          <p>&copy; 2025 moBix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
