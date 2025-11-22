import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Cookie } from "lucide-react"

export const metadata = {
  title: "Cookie Policy - moBix",
  description: "Learn about how moBix uses cookies and similar technologies.",
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Cookie className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-5xl font-bold text-white">Cookie Policy</h1>
        </div>
        <p className="text-[#888888] text-center mb-12">Last updated: December 15, 2024</p>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website.
              They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">moBix uses cookies for several purposes:</p>
            <ul className="list-disc list-inside text-[#CCCCCC] space-y-2">
              <li>
                <strong className="text-white">Essential Cookies:</strong> Required for the website to function properly
              </li>
              <li>
                <strong className="text-white">Performance Cookies:</strong> Help us understand how visitors interact
                with our website
              </li>
              <li>
                <strong className="text-white">Functionality Cookies:</strong> Remember your preferences and settings
              </li>
              <li>
                <strong className="text-white">Targeting Cookies:</strong> Used to deliver relevant advertisements
              </li>
            </ul>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
            <p className="text-[#CCCCCC] leading-relaxed mb-4">
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your
              computer and you can set most browsers to prevent them from being placed.
            </p>
            <p className="text-[#CCCCCC] leading-relaxed">
              However, if you do this, you may have to manually adjust some preferences every time you visit our site
              and some services and functionalities may not work.
            </p>
          </div>

          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-[#CCCCCC] leading-relaxed">
              If you have any questions about our use of cookies, please contact us at cookies@mobix.com
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
