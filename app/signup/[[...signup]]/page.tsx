"use client"

import { SignUp } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { RegistrationDisabledNotice } from "@/components/registration-disabled-notice"
import { Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [allowRegistrations, setAllowRegistrations] = useState<boolean | null>(null)

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await fetch("/api/site-settings/public")
        const data = await res.json()
        if (data.success && data.settings) {
          setAllowRegistrations(data.settings.allowRegistrations !== false)
        } else {
          setAllowRegistrations(true)
        }
      } catch {
        setAllowRegistrations(true)
      }
    }
    checkRegistration()
  }, [])

  if (allowRegistrations === null) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!allowRegistrations) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
        <RegistrationDisabledNotice />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1A1B23] border border-[#2A2B33]",
            headerTitle: "text-white",
            headerSubtitle: "text-[#CCCCCC]",
            formFieldLabel: "text-white",
            formFieldInput: "bg-[#0B0C10] border-[#2A2B33] text-white",
            formButtonPrimary: "bg-[#00FFFF] text-[#0B0C10] hover:bg-[#00CCCC]",
            footerActionLink: "text-[#00FFFF] hover:text-[#00CCCC]",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-[#00FFFF]",
          },
        }}
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/home"
      />
    </div>
  )
}
