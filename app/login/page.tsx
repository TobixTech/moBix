"use client"

import { SignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

export default function LoginPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/home")
    }
  }, [isLoaded, userId, router])

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 mb-2">
            moBix
          </h1>
          <p className="text-white/60">Sign in to your account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
          <SignIn
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
            redirectUrl="/home"
          />
        </div>
      </div>
    </div>
  )
}
