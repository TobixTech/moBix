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

          // Check maintenance mode - redirect non-admin users
          if (data.settings.maintenanceMode) {
            const isAdminRoute = pathname?.startsWith("/admin")
            const isMaintenancePage = pathname === "/maintenance"

            if (!isAdminRoute && !isMaintenancePage) {
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

  // If maintenance mode and not on maintenance page or admin, show nothing while redirecting
  if (loaded && settings.maintenanceMode && !pathname?.startsWith("/admin") && pathname !== "/maintenance") {
    return null
  }

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}
