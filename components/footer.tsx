import Link from "next/link"
import { ReportIssueModal } from "@/components/report-issue-modal"
import { RequestMovieModal } from "@/components/request-movie-modal"

export default function Footer() {
  return (
    <footer className="bg-[#0B0C10] border-t border-[#2A2B33] mt-16">
      {/* Request Movie Banner */}
      <div className="border-b border-[#2A2B33] bg-gradient-to-r from-[#0B0C10] via-[#1A1B23]/80 to-[#0B0C10]">
        <div className="px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Can't find what you're looking for?</h3>
            <p className="text-[#888888] text-sm">Request a movie and we'll try to add it to our collection.</p>
          </div>
          <div className="flex-shrink-0">
            <RequestMovieModal
              trigger={
                <button className="px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:bg-[#00CCCC] shadow-lg shadow-[#00FFFF]/30 hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all duration-300 transform hover:scale-105">
                  Request a Movie
                </button>
              }
            />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3
              className="text-2xl font-bold text-[#00FFFF] mb-4"
              style={{ textShadow: "0 0 10px rgba(0,255,255,0.5)" }}
            >
              moBix
            </h3>
            <p className="text-[#888888] text-sm mb-4">
              Your ultimate destination for free movie streaming. Watch unlimited movies and shows online.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-[#888888] text-sm">
              <li>
                <Link href="/about" className="hover:text-[#00FFFF] transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#00FFFF] transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#00FFFF] transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-[#888888] text-sm">
              <li>
                <Link href="/faq" className="hover:text-[#00FFFF] transition">
                  Help Center
                </Link>
              </li>
              <li>
                <ReportIssueModal />
              </li>
              <li>
                <RequestMovieModal
                  trigger={
                    <button className="hover:text-[#00FFFF] transition text-left text-[#888888]">Request Movie</button>
                  }
                />
              </li>
            </ul>
          </div>

          {/* Legal Links */}
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

        {/* Bottom Bar */}
        <div className="border-t border-[#2A2B33] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#888888] text-sm">&copy; {new Date().getFullYear()} moBix. All rights reserved.</p>
          <p className="text-[#666666] text-xs">Made with passion for movie lovers worldwide</p>
        </div>
      </div>
    </footer>
  )
}
