import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Cookie } from "lucide-react"

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={true} />

      <div className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Cookie className="w-12 h-12 text-[#00FFFF] mr-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Cookie <span className="text-[#00FFFF] glow-cyan">Policy</span>
          </h1>
        </div>

        <p className="text-white/60 text-center mb-12">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p className="text-white/80 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website. They help us
              provide you with a better experience by remembering your preferences and understanding how you use our
              platform.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Types of Cookies We Use</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Essential Cookies</h3>
                <p className="text-white/80 leading-relaxed">
                  These cookies are necessary for the website to function properly. They enable core functionality such
                  as security, network management, and accessibility. You cannot opt-out of these cookies.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Performance Cookies</h3>
                <p className="text-white/80 leading-relaxed">
                  These cookies help us understand how visitors interact with our website by collecting and reporting
                  information anonymously. This helps us improve the website's performance and user experience.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Functional Cookies</h3>
                <p className="text-white/80 leading-relaxed">
                  These cookies enable enhanced functionality and personalization, such as remembering your preferences,
                  language settings, and recently watched content.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Targeting/Advertising Cookies</h3>
                <p className="text-white/80 leading-relaxed">
                  These cookies are used to deliver advertisements that are relevant to you and your interests. They
                  also help limit the number of times you see an advertisement and measure the effectiveness of
                  advertising campaigns.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              We also use third-party services that may set cookies on your device:
            </p>
            <ul className="space-y-2 text-white/80 list-disc list-inside">
              <li>Analytics providers (e.g., Google Analytics) to understand user behavior</li>
              <li>Advertising networks to show relevant ads</li>
              <li>Social media platforms for sharing features</li>
              <li>Payment processors for secure transactions</li>
            </ul>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Managing Your Cookie Preferences</h2>
            <div className="space-y-4 text-white/80">
              <p className="leading-relaxed">You can control and manage cookies in several ways:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-white">Browser Settings:</strong> Most browsers allow you to refuse or accept
                  cookies through their settings. Note that disabling cookies may affect website functionality.
                </li>
                <li>
                  <strong className="text-white">Cookie Consent Tool:</strong> Use our cookie consent banner to manage
                  your preferences when you first visit the site.
                </li>
                <li>
                  <strong className="text-white">Third-Party Opt-Outs:</strong> Visit third-party websites to opt-out of
                  their cookies directly.
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">How Long Do Cookies Last?</h2>
            <div className="space-y-4 text-white/80">
              <p className="leading-relaxed">Cookies can be either:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-white">Session Cookies:</strong> Temporary cookies that expire when you close
                  your browser
                </li>
                <li>
                  <strong className="text-white">Persistent Cookies:</strong> Cookies that remain on your device for a
                  set period or until you delete them
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Updates to This Policy</h2>
            <p className="text-white/80 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our
              practices. Please review this page periodically for the latest information on our cookie practices.
            </p>
          </section>

          <section className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="space-y-2 text-white/80">
              <p>
                Email:{" "}
                <a href="mailto:privacy@mobix.com" className="text-[#00FFFF] hover:underline">
                  privacy@mobix.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
