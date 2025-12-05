import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import MobileBottomNav from "@/components/mobile-bottom-nav"
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo-structured-data"
import { UserSync } from "@/components/user-sync"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "moBix - Stream Movies & Shows Online Free",
    template: "%s | moBix",
  },
  description:
    "Watch unlimited movies, TV shows, and exclusive content on moBix. Stream free HD movies online - Action, Drama, Comedy, Nollywood & more. No subscription required.",
  keywords: [
    "free movies",
    "stream movies online",
    "watch movies free",
    "HD movies",
    "Nollywood movies",
    "action movies",
    "drama movies",
    "comedy movies",
    "movie streaming",
    "moBix",
    "free streaming",
    "watch online",
  ],
  generator: "v0.app",
  applicationName: "moBix",
  authors: [{ name: "moBix Team" }],
  creator: "moBix",
  publisher: "moBix",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "moBix - Stream Movies & Shows Online Free",
    description: "Watch unlimited movies, TV shows, and exclusive content on moBix. Stream free HD movies online.",
    type: "website",
    siteName: "moBix",
    locale: "en_US",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "moBix - Free Movie Streaming",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "moBix - Stream Movies & Shows Online Free",
    description: "Watch unlimited movies, TV shows, and exclusive content on moBix. Stream free HD movies online.",
    images: ["/og-image.jpg"],
    creator: "@mobix",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "entertainment",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00FFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0C10" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
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
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="moBix" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="msapplication-TileColor" content="#00FFFF" />
          <meta name="msapplication-tap-highlight" content="no" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <WebsiteStructuredData />
          <OrganizationStructuredData />
        </head>
        <body className={`font-sans antialiased bg-[#0B0C10] text-white`}>
          <UserSync />
          {children}
          <MobileBottomNav />
          <PWAInstallPrompt />
          <Analytics />
          <Toaster />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('ServiceWorker registration successful');
                      },
                      function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      }
                    );
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
