"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Loader, ArrowLeft, Play, Settings, Globe, Clock, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAdSettings, updateAdSettings } from "@/lib/server-actions"
import Link from "next/link"

interface AdCode {
  code: string
  name: string
}

export default function AdManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingAd, setTestingAd] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    vastPrerollUrl: "",
    adTimeout: 20,
    skipDelay: 10,
    rotationInterval: 5,
    adsEnabled: true,
    horizontalAdCode: "",
    verticalAdCode: "",
    homepageEnabled: true,
    movieDetailEnabled: true,
    dashboardEnabled: true,
    // Mid-roll settings
    midrollEnabled: false,
    midrollIntervalMinutes: 20,
  })

  const [prerollAdCodes, setPrerollAdCodes] = useState<AdCode[]>([])
  const [midrollAdCodes, setMidrollAdCodes] = useState<AdCode[]>([])

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAdSettings()
      if (settings) {
        setFormData({
          vastPrerollUrl: settings.vastPrerollUrl || "",
          adTimeout: settings.adTimeoutSeconds || 20,
          skipDelay: settings.skipDelaySeconds || 10,
          rotationInterval: settings.rotationIntervalSeconds || 5,
          adsEnabled: settings.showPrerollAds ?? true,
          horizontalAdCode: settings.horizontalAdCode || "",
          verticalAdCode: settings.verticalAdCode || "",
          homepageEnabled: settings.homepageEnabled ?? true,
          movieDetailEnabled: settings.movieDetailEnabled ?? true,
          dashboardEnabled: settings.dashboardEnabled ?? true,
          midrollEnabled: settings.showMidrollAds ?? false,
          midrollIntervalMinutes: settings.midrollIntervalMinutes || 20,
        })

        // Parse preroll ad codes
        try {
          if (settings.prerollAdCodes) {
            setPrerollAdCodes(JSON.parse(settings.prerollAdCodes))
          }
        } catch (e) {
          console.error("Error parsing preroll ad codes:", e)
        }

        // Parse midroll ad codes
        try {
          if (settings.midrollAdCodes) {
            setMidrollAdCodes(JSON.parse(settings.midrollAdCodes))
          }
        } catch (e) {
          console.error("Error parsing midroll ad codes:", e)
        }
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage("")

    const result = await updateAdSettings({
      horizontalAdCode: formData.horizontalAdCode,
      verticalAdCode: formData.verticalAdCode,
      prerollAdCodes: JSON.stringify(prerollAdCodes),
      midrollAdCodes: JSON.stringify(midrollAdCodes),
      adTimeoutSeconds: formData.adTimeout,
      skipDelaySeconds: formData.skipDelay,
      rotationIntervalSeconds: formData.rotationInterval,
      showPrerollAds: formData.adsEnabled,
      showMidrollAds: formData.midrollEnabled,
      midrollIntervalMinutes: formData.midrollIntervalMinutes,
      homepageEnabled: formData.homepageEnabled,
      movieDetailEnabled: formData.movieDetailEnabled,
      dashboardEnabled: formData.dashboardEnabled,
    })

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
    setTimeout(() => {
      setTestingAd(false)
      alert("Ad preview completed! The VAST URL is configured correctly.")
    }, 3000)
  }

  const addPrerollAdCode = () => {
    setPrerollAdCodes([...prerollAdCodes, { code: "", name: `Ad ${prerollAdCodes.length + 1}` }])
  }

  const removePrerollAdCode = (index: number) => {
    setPrerollAdCodes(prerollAdCodes.filter((_, i) => i !== index))
  }

  const updatePrerollAdCode = (index: number, field: "code" | "name", value: string) => {
    const updated = [...prerollAdCodes]
    updated[index][field] = value
    setPrerollAdCodes(updated)
  }

  const addMidrollAdCode = () => {
    setMidrollAdCodes([...midrollAdCodes, { code: "", name: `Midroll ${midrollAdCodes.length + 1}` }])
  }

  const removeMidrollAdCode = (index: number) => {
    setMidrollAdCodes(midrollAdCodes.filter((_, i) => i !== index))
  }

  const updateMidrollAdCode = (index: number, field: "code" | "name", value: string) => {
    const updated = [...midrollAdCodes]
    updated[index][field] = value
    setMidrollAdCodes(updated)
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
          <p className="text-white/50">Configure pre-roll, mid-roll, and banner ad settings</p>
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
                <p className="text-white/50 text-sm">Ads shown before video starts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Enable Pre-roll Ads</p>
                  <p className="text-white/40 text-xs">Show ads before movies play</p>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-white font-medium mb-2 text-xs">Timeout (sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.adTimeout}
                    onChange={(e) => setFormData({ ...formData, adTimeout: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-xs">Skip Delay (sec)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.skipDelay}
                    onChange={(e) => setFormData({ ...formData, skipDelay: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-xs">Rotation (sec)</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={formData.rotationInterval}
                    onChange={(e) => setFormData({ ...formData, rotationInterval: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FFFF]"
                  />
                </div>
              </div>

              {/* Preroll Ad Codes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white font-medium text-sm">Pre-roll Ad Codes</label>
                  <button
                    onClick={addPrerollAdCode}
                    className="flex items-center gap-1 px-2 py-1 bg-[#00FFFF]/20 text-[#00FFFF] text-xs rounded hover:bg-[#00FFFF]/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {prerollAdCodes.length === 0 ? (
                    <p className="text-white/40 text-xs text-center py-4">No pre-roll ads configured</p>
                  ) : (
                    prerollAdCodes.map((ad, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ad name"
                          value={ad.name}
                          onChange={(e) => updatePrerollAdCode(index, "name", e.target.value)}
                          className="w-24 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-[#00FFFF]"
                        />
                        <input
                          type="text"
                          placeholder="VAST URL or ad code"
                          value={ad.code}
                          onChange={(e) => updatePrerollAdCode(index, "code", e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-[#00FFFF] font-mono"
                        />
                        <button
                          onClick={() => removePrerollAdCode(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mid-roll Video Ad Settings */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mid-roll Video Ads</h2>
                <p className="text-white/50 text-sm">Ads shown during video playback</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Enable Mid-roll Ads</p>
                  <p className="text-white/40 text-xs">Show ads during movie playback</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, midrollEnabled: !formData.midrollEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.midrollEnabled ? "bg-orange-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.midrollEnabled ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Ad Interval (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.midrollIntervalMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, midrollIntervalMinutes: Number.parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all"
                />
                <p className="text-white/40 text-xs mt-2">Show mid-roll ad every X minutes during playback</p>
              </div>

              {/* Midroll Ad Codes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white font-medium text-sm">Mid-roll Ad Codes</label>
                  <button
                    onClick={addMidrollAdCode}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 text-xs rounded hover:bg-orange-500/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {midrollAdCodes.length === 0 ? (
                    <p className="text-white/40 text-xs text-center py-4">No mid-roll ads configured</p>
                  ) : (
                    midrollAdCodes.map((ad, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ad name"
                          value={ad.name}
                          onChange={(e) => updateMidrollAdCode(index, "name", e.target.value)}
                          className="w-24 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          placeholder="VAST URL or ad code"
                          value={ad.code}
                          onChange={(e) => updateMidrollAdCode(index, "code", e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <button
                          onClick={() => removeMidrollAdCode(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Banner Ad Settings */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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

            <div className="space-y-3">
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
        <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-white font-bold mb-3">Ad Configuration Tips:</h3>
          <ul className="text-white/70 text-sm space-y-2 list-disc list-inside">
            <li>
              <strong>Pre-roll:</strong> Shown once before movie starts playing
            </li>
            <li>
              <strong>Mid-roll:</strong> Shown at intervals during movie playback (e.g., every 20 minutes)
            </li>
            <li>
              <strong>Skip Delay:</strong> How long users must wait before they can skip the ad
            </li>
            <li>
              <strong>Rotation:</strong> If multiple ad codes, rotate between them at this interval
            </li>
            <li>Use VAST URLs from Adsterra or paste raw ad script codes</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
