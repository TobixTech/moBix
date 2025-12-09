"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

interface SiteSettings {
  maintenanceMode: boolean
  allowRegistrations: boolean
  enableComments: boolean
  enableDownloads: boolean
}

const defaultSettings: SiteSettings = {
  maintenanceMode: false,
  allowRegistrations: true,
  enableComments: true,
  enableDownloads: true,
}

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings)

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}

const MAINTENANCE_EXEMPT_ROUTES = [
  "/admin", // All admin routes (dashboard, login, signup, etc.)
  "/admin/access-key",
  "/admin/dashboard",
  "/admin/login",
  "/admin/signup",
  "/admin/point",
  "/admin/seed",
  "/admin/ads",
  "/maintenance", // The maintenance page itself
  "/api", // All API routes
]

function isExemptFromMaintenance(pathname: string | null): boolean {
  if (!pathname) return false

  return MAINTENANCE_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(route),
  )
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/site-settings/public")
        const data = await res.json()
        if (data.success && data.settings) {
          setSettings(data.settings)

          // Check maintenance mode - redirect non-exempt routes
          if (data.settings.maintenanceMode) {
            const isExempt = isExemptFromMaintenance(pathname)

            if (!isExempt) {
              router.push("/maintenance")
            }
          }
        }
      } catch (error) {
        console.error("Error fetching site settings:", error)
      } finally {
        setLoaded(true)
      }
    }

    fetchSettings()

    // Poll for changes every 60 seconds
    const interval = setInterval(fetchSettings, 60000)
    return () => clearInterval(interval)
  }, [pathname, router])

  // If maintenance mode and not exempt, show nothing while redirecting
  if (loaded && settings.maintenanceMode && !isExemptFromMaintenance(pathname)) {
    return null
  }

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}
