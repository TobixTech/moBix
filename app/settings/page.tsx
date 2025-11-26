import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import SettingsPageClient from "./settings-page-client"
import { getUserProfile } from "@/lib/server-actions"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your moBix account settings and preferences.",
}

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const profileResult = await getUserProfile()

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar showAuthButtons={false} />

      <div className="pt-20 px-4 md:px-8 max-w-4xl mx-auto">
        <SettingsPageClient user={profileResult.success ? profileResult.user : null} />
      </div>

      <Footer />
    </main>
  )
}
