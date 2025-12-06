"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Calendar,
  Heart,
  MessageSquare,
  Edit2,
  Save,
  X,
  Settings,
  Globe,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getUserProfile, updateUserProfile, getUserStats, getCurrentUserDetails } from "@/lib/server-actions"
import ErrorMessage from "@/components/error-message"
import { COUNTRIES } from "@/lib/countries"
import { useToast } from "@/hooks/use-toast"

function PremiumLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">m</span>
          </div>
        </div>
        <p className="text-white/60 animate-pulse">Loading profile...</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ likesCount: 0, commentsCount: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [canChangeCountry, setCanChangeCountry] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [showCountryEdit, setShowCountryEdit] = useState(false)
  const [savingCountry, setSavingCountry] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
  })

  useEffect(() => {
    if (isLoaded) {
      if (clerkUser) {
        loadProfile()
      } else {
        setIsLoading(false)
      }
    }
  }, [isLoaded, clerkUser])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError("")

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))

      const dataPromise = Promise.all([getUserProfile(), getCurrentUserDetails()])

      const [result, userDetails] = (await Promise.race([dataPromise, timeoutPromise])) as [any, any]

      if (result.success && result.user) {
        setProfile(result.user)
        setFormData({
          username: result.user.username || "",
          firstName: result.user.firstName || "",
          lastName: result.user.lastName || "",
        })

        const statsResult = await getUserStats(clerkUser?.id || "")
        setStats(statsResult)
      } else {
        setError(result.error || "Failed to load profile")
      }

      if (userDetails) {
        setUserCountry(userDetails.country || null)
        setCanChangeCountry(!userDetails.countryChangedAt)
        setSelectedCountry(userDetails.country || "")
      }
    } catch (err: any) {
      console.error("[v0] Profile load error:", err)
      setError(err.message === "Request timeout" ? "Loading took too long. Please refresh." : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      console.log("[v0] Saving profile with data:", formData)

      const result = await updateUserProfile(formData)

      console.log("[v0] Update result:", result)

      if (result.success) {
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        // Reload profile to get fresh data
        await loadProfile()
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        })
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Failed to update profile")
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("[v0] Error saving profile:", err)
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeCountry = async () => {
    if (!selectedCountry || selectedCountry === userCountry) return

    setSavingCountry(true)
    try {
      const res = await fetch("/api/user/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry }),
      })
      const result = await res.json()

      if (result.success) {
        setUserCountry(selectedCountry)
        setCanChangeCountry(false)
        setShowCountryEdit(false)
        toast({
          title: "Country Updated",
          description: "Your country has been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update country.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingCountry(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({
      username: profile?.username || "",
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
    })
    setError("")
  }

  const countryInfo = userCountry ? COUNTRIES.find((c) => c.name === userCountry || c.code === userCountry) : null

  if (!isLoaded || isLoading) {
    return <PremiumLoader />
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10]">
        <Navbar showAuthButtons={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <User className="w-16 h-16 text-cyan-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-white/60">Please sign in to view your profile</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10]">
        <Navbar showAuthButtons={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Profile</h2>
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={loadProfile}
              className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10]">
      <Navbar showAuthButtons={false} />

      <div className="container mx-auto px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] flex items-center justify-center text-[#0B0C10] text-3xl font-bold">
                  {profile?.imageUrl ? (
                    <img
                      src={profile.imageUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile?.username || profile?.firstName || "User"}
                  </h1>
                  <div className="flex items-center gap-2 text-[#888888]">
                    <Mail className="w-4 h-4" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#888888] mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                  {countryInfo && (
                    <div className="flex items-center gap-2 text-[#888888] mt-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-lg mr-1">{countryInfo.flag}</span>
                      <span>{countryInfo.name}</span>
                    </div>
                  )}
                  {profile?.role === "ADMIN" && (
                    <div className="mt-2 inline-block px-3 py-1 bg-[#00FFFF]/20 border border-[#00FFFF]/50 rounded-full text-[#00FFFF] text-xs font-semibold">
                      Admin
                    </div>
                  )}
                  {profile?.role === "PREMIUM" && (
                    <div className="mt-2 inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-400 text-xs font-semibold">
                      Premium
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit()
                  } else {
                    setIsEditing(true)
                  }
                }}
                className="p-2 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-[#00FFFF] hover:bg-[#00FFFF]/10 transition"
              >
                {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-[#00FFFF]" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.likesCount}</p>
                    <p className="text-sm text-[#888888]">Movies Liked</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-[#00FFFF]" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.commentsCount}</p>
                    <p className="text-sm text-[#888888]">Comments Posted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <motion.div
              className="bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#00FFFF]" />
                Edit Profile
              </h2>

              {error && <ErrorMessage message={error} />}
              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#888888] mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                    placeholder="Enter username"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#888888] mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Country
                  </label>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg">
                      {countryInfo ? (
                        <>
                          <span className="text-xl">{countryInfo.flag}</span>
                          <span className="text-white">{countryInfo.name}</span>
                        </>
                      ) : (
                        <span className="text-white/60">Not set</span>
                      )}
                    </div>

                    {canChangeCountry && !showCountryEdit && (
                      <button
                        type="button"
                        onClick={() => setShowCountryEdit(true)}
                        className="px-3 py-2 text-sm bg-[#00FFFF]/20 border border-[#00FFFF]/30 rounded-lg text-[#00FFFF] hover:bg-[#00FFFF]/30 transition"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {showCountryEdit && canChangeCountry && (
                    <div className="p-4 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        You can only change your country once
                      </div>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleChangeCountry}
                          disabled={savingCountry || !selectedCountry}
                          className="px-4 py-2 bg-[#00FFFF] text-[#0B0C10] font-medium rounded-lg hover:bg-[#00CCCC] transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingCountry ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Confirm
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCountryEdit(false)}
                          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!canChangeCountry && (
                    <p className="text-sm text-[#666666]">
                      Country has already been changed and cannot be modified again.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Settings Section */}
          <div className="bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00FFFF]" />
              Account Settings
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg">
                <p className="text-white font-medium mb-1">Email Address</p>
                <p className="text-sm text-[#888888]">{profile?.email}</p>
                <p className="text-xs text-[#666666] mt-2">Email cannot be changed. Contact support for help.</p>
              </div>

              <div className="p-4 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg">
                <p className="text-white font-medium mb-1">Account Type</p>
                <p className="text-sm text-[#888888]">
                  {profile?.role === "ADMIN"
                    ? "Admin Account"
                    : profile?.role === "PREMIUM"
                      ? "Premium Account"
                      : "User Account"}
                </p>
              </div>

              <div className="p-4 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg">
                <p className="text-white font-medium mb-1">Country</p>
                {countryInfo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{countryInfo.flag}</span>
                    <span className="text-sm text-[#888888]">{countryInfo.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-[#888888]">Not set</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
