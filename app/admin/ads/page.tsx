"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Loader, ArrowLeft, Play, Settings, Globe, Plus, Trash2, Clock } from "lucide-react"
import { getAdSettings, updateAdSettings } from "@/lib/server-actions"
import Link from "next/link"

interface AdCode {
  code: string
  name: string
}

export default function AdManagementPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    adTimeout: 20,
    skipDelay: 10,
    rotationInterval: 5,
    adsEnabled: true,
    horizontalAdCode: "",
    verticalAdCode: "",
    homepageEnabled: true,
    movieDetailEnabled: true,
    dashboardEnabled: true,
    midrollEnabled: false,
    midrollIntervalMinutes: 20,
  })

  const [prerollAdCodes, setPrerollAdCodes] = useState<AdCode[]>([])
  const [midrollAdCodes, setMidrollAdCodes] = useState<AdCode[]>([])
  const [newPrerollCode, setNewPrerollCode] = useState({ name: "", code: "" })
  const [newMidrollCode, setNewMidrollCode] = useState({ name: "", code: "" })

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAdSettings()
      if (settings) {
        setFormData({
          adTimeout: settings.adTimeoutSeconds || 20,
          skipDelay: settings.skipDelaySeconds || 10,
          rotationInterval: settings.rotationIntervalSeconds || 5,
          adsEnabled: settings.showPrerollAds ?? true,
          horizontalAdCode: settings.horizontalAdCode || "",
          verticalAdCode: settings.verticalAdCode || "",
          homepageEnabled: settings.homepageEnabled ?? true,
          movieDetailEnabled: settings.movieDetailEnabled ?? true,
          dashboardEnabled: settings.dashboardEnabled ?? true,
          midrollEnabled: settings.midrollEnabled ?? false,
          midrollIntervalMinutes: settings.midrollIntervalMinutes || 20,
        })

        try {
          if (settings.prerollAdCodes) {
            const codes = JSON.parse(settings.prerollAdCodes)
            setPrerollAdCodes(codes)
          }
        } catch (e) {
          console.error("Error parsing preroll codes:", e)
        }

        try {
          if (settings.midrollAdCodes) {
            const codes = JSON.parse(settings.midrollAdCodes)
            setMidrollAdCodes(codes)
          }
        } catch (e) {
          console.error("Error parsing midroll codes:", e)
        }
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleAddPrerollCode = () => {
    if (newPrerollCode.code.trim()) {
      setPrerollAdCodes([
        ...prerollAdCodes,
        {
          name: newPrerollCode.name || `Ad ${prerollAdCodes.length + 1}`,
          code: newPrerollCode.code,
        },
      ])
      setNewPrerollCode({ name: "", code: "" })
    }
  }

  const handleRemovePrerollCode = (index: number) => {
    setPrerollAdCodes(prerollAdCodes.filter((_, i) => i !== index))
  }

  const handleAddMidrollCode = () => {
    if (newMidrollCode.code.trim()) {
      setMidrollAdCodes([
        ...midrollAdCodes,
        {
          name: newMidrollCode.name || `Midroll Ad ${midrollAdCodes.length + 1}`,
          code: newMidrollCode.code,
        },
      ])
      setNewMidrollCode({ name: "", code: "" })
    }
  }

  const handleRemoveMidrollCode = (index: number) => {
    setMidrollAdCodes(midrollAdCodes.filter((_, i) => i !== index))
  }

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
          <p className="text-white/50">Configure pre-roll, mid-roll, and banner ads</p>
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
                <p className="text-white/50 text-sm">Ads shown before movie plays</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Pre-roll */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Enable Pre-roll Ads</p>
                  <p className="text-white/40 text-xs">Show ads before video playback</p>
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

              {/* Pre-roll Ad Codes List */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Pre-roll Ad Codes</label>
                <div className="space-y-2 mb-3">
                  {prerollAdCodes.map((ad, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{ad.name}</p>
                        <p className="text-white/40 text-xs truncate">{ad.code.substring(0, 50)}...</p>
                      </div>
                      <button
                        onClick={() => handleRemovePrerollCode(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Pre-roll Code */}
                <div className="space-y-2 p-4 bg-white/5 rounded-lg">
                  <input
                    type="text"
                    value={newPrerollCode.name}
                    onChange={(e) => setNewPrerollCode({ ...newPrerollCode, name: e.target.value })}
                    placeholder="Ad Name (optional)"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00FFFF]"
                  />
                  <textarea
                    value={newPrerollCode.code}
                    onChange={(e) => setNewPrerollCode({ ...newPrerollCode, code: e.target.value })}
                    placeholder="Paste ad embed code here..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00FFFF] resize-none font-mono"
                  />
                  <button
                    onClick={handleAddPrerollCode}
                    disabled={!newPrerollCode.code.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 text-[#00FFFF] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Pre-roll Ad
                  </button>
                </div>
              </div>

              {/* Ad Timing Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Ad Timeout (sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.adTimeout}
                    onChange={(e) => setFormData({ ...formData, adTimeout: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Skip Delay (sec)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.skipDelay}
                    onChange={(e) => setFormData({ ...formData, skipDelay: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                  />
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
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mid-roll Video Ads</h2>
                <p className="text-white/50 text-sm">Ads shown during movie playback</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Mid-roll */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Enable Mid-roll Ads</p>
                  <p className="text-white/40 text-xs">Show ads during video playback</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, midrollEnabled: !formData.midrollEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.midrollEnabled ? "bg-orange-400" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.midrollEnabled ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Mid-roll Interval */}
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-400"
                />
                <p className="text-white/40 text-xs mt-2">Show mid-roll ad every X minutes during playback</p>
              </div>

              {/* Mid-roll Ad Codes List */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Mid-roll Ad Codes</label>
                <div className="space-y-2 mb-3">
                  {midrollAdCodes.map((ad, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{ad.name}</p>
                        <p className="text-white/40 text-xs truncate">{ad.code.substring(0, 50)}...</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMidrollCode(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Mid-roll Code */}
                <div className="space-y-2 p-4 bg-white/5 rounded-lg">
                  <input
                    type="text"
                    value={newMidrollCode.name}
                    onChange={(e) => setNewMidrollCode({ ...newMidrollCode, name: e.target.value })}
                    placeholder="Ad Name (optional)"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-400"
                  />
                  <textarea
                    value={newMidrollCode.code}
                    onChange={(e) => setNewMidrollCode({ ...newMidrollCode, code: e.target.value })}
                    placeholder="Paste ad embed code here..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-400 resize-none font-mono"
                  />
                  <button
                    onClick={handleAddMidrollCode}
                    disabled={!newMidrollCode.code.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-400/20 hover:bg-orange-400/30 text-orange-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Mid-roll Ad
                  </button>
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Vertical Ad Code</label>
                <textarea
                  value={formData.verticalAdCode}
                  onChange={(e) => setFormData({ ...formData, verticalAdCode: e.target.value })}
                  placeholder="<script>...</script>"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF] resize-none font-mono text-sm"
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
                        [item.key as keyof typeof formData]: !formData[item.key as keyof typeof formData],
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
      </div>
    </div>
  )
}
