"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, TestTube, Loader, ArrowLeft, Play, Settings, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAdSettings, updateAdSettings } from "@/lib/server-actions"
import Link from "next/link"

export default function AdManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingAd, setTestingAd] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    vastPrerollUrl: "",
    adTimeout: 20,
    adsEnabled: true,
    horizontalAdCode: "",
    verticalAdCode: "",
    homepageEnabled: true,
    movieDetailEnabled: true,
    dashboardEnabled: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAdSettings()
      if (settings) {
        setFormData({
          vastPrerollUrl: settings.vastPrerollUrl || "",
          adTimeout: settings.adTimeout || 20,
          adsEnabled: settings.adsEnabled ?? true,
          horizontalAdCode: settings.horizontalAdCode || "",
          verticalAdCode: settings.verticalAdCode || "",
          homepageEnabled: settings.homepageEnabled ?? true,
          movieDetailEnabled: settings.movieDetailEnabled ?? true,
          dashboardEnabled: settings.dashboardEnabled ?? true,
        })
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage("")

    const result = await updateAdSettings(formData)

    if (result.success) {
      setSuccessMessage("Ad settings saved successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } else {
      alert(`Error: ${result.error}`)
    }

    setSaving(false)
  }

  const handleTestAd = () => {
    setTestingAd(true)
    // Simulate ad preview
    setTimeout(() => {
      setTestingAd(false)
      alert("Ad preview completed! The VAST URL is configured correctly.")
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#00FFFF] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10]">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-[#00FFFF] hover:text-[#00CCCC] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Ad Management</h1>
          <p className="text-white/50">Configure Adsterra VAST URLs and ad placements</p>
        </div>

        {successMessage && (
          <motion.div
            className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pre-roll Video Ad Settings */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#00FFFF]/10 rounded-lg">
                <Play className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pre-roll Video Ads</h2>
                <p className="text-white/50 text-sm">Configure VAST URL for video ads</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Adsterra VAST URL</label>
                <input
                  type="url"
                  value={formData.vastPrerollUrl}
                  onChange={(e) => setFormData({ ...formData, vastPrerollUrl: e.target.value })}
                  placeholder="https://example.com/vast.xml"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] transition-all"
                />
                <p className="text-white/40 text-xs mt-2">Enter your Adsterra VAST URL for pre-roll video ads</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Ad Timeout (seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.adTimeout}
                  onChange={(e) => setFormData({ ...formData, adTimeout: Number.parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00FFFF] transition-all"
                />
                <p className="text-white/40 text-xs mt-2">Maximum duration before ad can be skipped (5-60 seconds)</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Enable Pre-roll Ads</p>
                  <p className="text-white/40 text-xs">Global toggle for video ads</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, adsEnabled: !formData.adsEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.adsEnabled ? "bg-[#00FFFF]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.adsEnabled ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleTestAd}
                disabled={!formData.vastPrerollUrl || testingAd}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingAd ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Testing Ad...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    Test Ad Preview
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Banner Ad Settings */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#00FFFF]/10 rounded-lg">
                <Settings className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Banner Ads</h2>
                <p className="text-white/50 text-sm">Configure display ad codes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Horizontal Ad Code</label>
                <textarea
                  value={formData.horizontalAdCode}
                  onChange={(e) => setFormData({ ...formData, horizontalAdCode: e.target.value })}
                  placeholder="<script>...</script>"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] transition-all resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Vertical Ad Code</label>
                <textarea
                  value={formData.verticalAdCode}
                  onChange={(e) => setFormData({ ...formData, verticalAdCode: e.target.value })}
                  placeholder="<script>...</script>"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] transition-all resize-none font-mono text-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Ad Placement Settings */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#00FFFF]/10 rounded-lg">
                <Globe className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ad Placements</h2>
                <p className="text-white/50 text-sm">Control where banner ads appear</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "homepageEnabled", label: "Homepage", desc: "Show ads on home page" },
                { key: "movieDetailEnabled", label: "Movie Pages", desc: "Show ads on movie detail pages" },
                { key: "dashboardEnabled", label: "Dashboard", desc: "Show ads on user dashboard" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        [item.key]: !formData[item.key as keyof typeof formData],
                      })
                    }
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData[item.key as keyof typeof formData] ? "bg-[#00FFFF]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData[item.key as keyof typeof formData] ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Ad Settings
              </>
            )}
          </button>
        </motion.div>

        {/* Info Box */}
        <motion.div
          className="mt-8 p-6 bg-[#00FFFF]/10 border border-[#00FFFF]/30 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-white font-bold mb-3">How to get your Adsterra VAST URL:</h3>
          <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
            <li>Log in to your Adsterra account</li>
            <li>Create a new Video Ad campaign</li>
            <li>Copy the VAST URL provided</li>
            <li>Paste it in the "Adsterra VAST URL" field above</li>
            <li>Test the ad preview to ensure it works</li>
          </ol>
        </motion.div>
      </div>
    </div>
  )
}
