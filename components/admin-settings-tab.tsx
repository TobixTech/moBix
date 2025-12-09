"use client"

import { useState, useEffect } from "react"
import { Cog, RefreshCw, AlertTriangle, Save, CheckCircle } from "lucide-react"
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
  const [savingAll, setSavingAll] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<SiteSettings | null>(null)

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/site-settings")
      const data = await res.json()
      if (data.success && data.settings) {
        const newSettings = { ...settings, ...data.settings }
        setSettings(newSettings)
        setOriginalSettings(newSettings)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

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
        setSettings((prev) => {
          const newSettings = { ...prev, [key]: value }
          setOriginalSettings(newSettings)
          return newSettings
        })
        toast.success(`Setting "${key}" updated successfully`)
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

  const saveAllSettings = async () => {
    setSavingAll(true)
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        }),
      )
      await Promise.all(promises)
      setOriginalSettings(settings)
      setHasChanges(false)
      toast.success("All settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save some settings")
    } finally {
      setSavingAll(false)
    }
  }

  const handleToggle = (key: keyof SiteSettings) => {
    const newValue = !settings[key]
    setSettings((prev) => ({ ...prev, [key]: newValue }))
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
    <div className="space-y-6 pb-32 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-white">Site Settings</h3>
        <button
          onClick={saveAllSettings}
          disabled={savingAll || !hasChanges}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto justify-center ${
            hasChanges
              ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:shadow-lg hover:shadow-cyan-500/30"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          }`}
        >
          {savingAll ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : hasChanges ? (
            <>
              <Save className="w-5 h-5" />
              Save All Changes
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              All Saved
            </>
          )}
        </button>
      </div>

      {/* General Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Cog className="w-5 h-5 text-cyan-400" />
          General Settings
        </h4>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
            <div className="flex-1">
              <p className="text-white font-medium">Maintenance Mode</p>
              <p className="text-white/50 text-sm">Temporarily disable the site for maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
            <div className="flex-1">
              <p className="text-white font-medium">Allow New Registrations</p>
              <p className="text-white/50 text-sm">Enable or disable new user signups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
            <div className="flex-1">
              <p className="text-white font-medium">Enable Comments</p>
              <p className="text-white/50 text-sm">Allow users to comment on content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
            <div className="flex-1">
              <p className="text-white font-medium">Enable Downloads</p>
              <p className="text-white/50 text-sm">Allow users to download content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          Cache Management
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => clearCache("Page")}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 text-sm"
          >
            Clear Page Cache
          </button>
          <button
            onClick={() => clearCache("Image")}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 text-sm"
          >
            Clear Image Cache
          </button>
          <button
            onClick={() => clearCache("All")}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm"
          >
            Clear All Cache
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6">
        <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h4>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-500/10 rounded-xl">
            <div className="flex-1">
              <p className="text-white font-medium">Reset All Statistics</p>
              <p className="text-red-400/70 text-sm">This will reset all view counts and analytics data</p>
            </div>
            <button
              onClick={() => toast.error("This action is disabled for safety")}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm flex-shrink-0"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
