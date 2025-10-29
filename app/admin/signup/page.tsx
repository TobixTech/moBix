"use client"

import { SignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

export default function AdminSignupPage() {
  const { isLoaded, userId, sessionClaims } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      const userRole = sessionClaims?.metadata?.role
      if (userRole === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [isLoaded, userId, sessionClaims, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 mb-2">
            moBix Admin
          </h1>
          <p className="text-white/60">Create your admin account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-0 shadow-none",
                headerTitle: "text-white text-2xl font-bold",
                headerSubtitle: "text-white/60",
                socialButtonsBlockButton: "bg-white/10 border border-white/20 text-white hover:bg-white/20",
                formButtonPrimary: "bg-cyan-500 hover:bg-cyan-600 text-black font-bold",
                formFieldInput: "bg-white/5 border border-white/10 text-white placeholder-white/40",
                formFieldLabel: "text-white/80",
                footerActionLink: "text-cyan-400 hover:text-cyan-300",
              },
            }}
            redirectUrl="/admin/dashboard"
          />
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> You will need an invitation code to complete admin registration. Contact your
            administrator for the code.
          </p>
        </div>
      </div>
    </div>
  )
}
