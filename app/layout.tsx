import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "moBix - Premium Movie Streaming Platform",
  description:
    "Stream premium movies with smart recommendations, personalized watchlists, and collaborative filtering technology. Discover your next favorite movie on moBix.",
  keywords: ["movie streaming", "watch movies online", "movie recommendations", "film streaming", "entertainment"],
  authors: [{ name: "moBix" }],
  creator: "moBix",
  publisher: "moBix",
  generator: "v0.app",
  applicationName: "moBix",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL("https://mobix.vercel.app"),
  openGraph: {
    title: "moBix - Premium Movie Streaming Platform",
    description: "Stream premium movies with smart recommendations and personalized watchlists",
    url: "https://mobix.vercel.app",
    siteName: "moBix",
    images: [
      {
        url: "/cinematic-hero-banner.png",
        width: 1200,
        height: 630,
        alt: "moBix - Premium Movie Streaming",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "moBix - Premium Movie Streaming Platform",
    description: "Stream premium movies with smart recommendations",
    images: ["/cinematic-hero-banner.png"],
  },
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: "#00FFFF",
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
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#00FFFF" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="moBix" />
        </head>
        <body className={`font-sans antialiased bg-[#0B0C10] text-white`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
