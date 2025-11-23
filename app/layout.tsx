import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "moBix - Stream Your Favorites",
  description: "Premium streaming platform for movies and shows",
  generator: "v0.app",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "moBix - Stream Your Favorites",
    description: "Premium streaming platform for movies and shows",
    type: "website",
    siteName: "moBix",
  },
  twitter: {
    card: "summary_large_image",
    title: "moBix - Stream Your Favorites",
    description: "Premium streaming platform for movies and shows",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <meta name="6a97888e-site-verification" content="31d833de3e94dcf092ac2dec8b419b57" />
        </head>
        <body className={`font-sans antialiased bg-[#0B0C10] text-white`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
