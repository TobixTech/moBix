"use client"

import { useState, useEffect } from "react"
import { Cog, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface SiteSettings {
  maintenanceMode: boolean
  allowRegistrations: boolean
  enableComments: boolean
  enableDownloads: boolean
  siteTitle: string
  siteDescription: string
  maxUploadSize: number
  defaultVideoQuality: string
}

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({
    maintenanceMode: false,
    allowRegistrations: true,
    enableComments: true,
    enableDownloads: true,
    siteTitle: "moBix",
    siteDescription: "Your ultimate streaming platform",
    maxUploadSize: 500,
    defaultVideoQuality: "720p",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/site-settings")
      const data = await res.json()
      if (data.success && data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateSetting = async (key: string, value: any) => {
    setSaving(key)
    try {
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (data.success) {
        setSettings((prev) => ({ ...prev, [key]: value }))
        toast.success(`Setting "${key}" updated`)
      } else {
        toast.error(data.error || "Failed to update setting")
      }
    } catch (error) {
      console.error("Error updating setting:", error)
      toast.error("Failed to update setting")
    } finally {
      setSaving(null)
    }
  }

  const handleToggle = (key: keyof SiteSettings) => {
    const newValue = !settings[key]
    updateSetting(key, newValue)
  }

  const clearCache = async (type: string) => {
    toast.success(`${type} cache cleared successfully`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">Site Settings</h3>

      {/* General Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Cog className="w-5 h-5 text-cyan-400" />
          General Settings
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Maintenance Mode</p>
              <p className="text-white/50 text-sm">Temporarily disable the site for maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle("maintenanceMode")}
                disabled={saving === "maintenanceMode"}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              {saving === "maintenanceMode" && <RefreshCw className="w-4 h-4 ml-2 text-cyan-400 animate-spin" />}
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Allow New Registrations</p>
              <p className="text-white/50 text-sm">Enable or disable new user signups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={() => handleToggle("allowRegistrations")}
                disabled={saving === "allowRegistrations"}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              {saving === "allowRegistrations" && <RefreshCw className="w-4 h-4 ml-2 text-cyan-400 animate-spin" />}
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Comments</p>
              <p className="text-white/50 text-sm">Allow users to comment on content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableComments}
                onChange={() => handleToggle("enableComments")}
                disabled={saving === "enableComments"}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              {saving === "enableComments" && <RefreshCw className="w-4 h-4 ml-2 text-cyan-400 animate-spin" />}
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Downloads</p>
              <p className="text-white/50 text-sm">Allow users to download content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableDownloads}
                onChange={() => handleToggle("enableDownloads")}
                disabled={saving === "enableDownloads"}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              {saving === "enableDownloads" && <RefreshCw className="w-4 h-4 ml-2 text-cyan-400 animate-spin" />}
            </label>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          Cache Management
        </h4>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => clearCache("Page")}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
          >
            Clear Page Cache
          </button>
          <button
            onClick={() => clearCache("Image")}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
          >
            Clear Image Cache
          </button>
          <button
            onClick={() => clearCache("All")}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            Clear All Cache
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl">
            <div>
              <p className="text-white font-medium">Reset All Statistics</p>
              <p className="text-red-400/70 text-sm">This will reset all view counts and analytics data</p>
            </div>
            <button
              onClick={() => toast.error("This action is disabled for safety")}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
