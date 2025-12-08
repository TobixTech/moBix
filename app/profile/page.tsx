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
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getUserProfile, updateUserProfile, getUserStats, getCurrentUserDetails } from "@/lib/server-actions"
import LoadingSpinner from "@/components/loading-spinner"
import ErrorMessage from "@/components/error-message"
import { COUNTRIES } from "@/lib/countries"
import { useToast } from "@/hooks/use-toast"

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

  const isPremium = profile?.role === "PREMIUM" || profile?.isPremium

  useEffect(() => {
    if (isLoaded && clerkUser) {
      loadProfile()
    }
  }, [isLoaded, clerkUser])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const [result, userDetails] = await Promise.all([getUserProfile(), getCurrentUserDetails()])

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
    } catch (err) {
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const result = await updateUserProfile(formData)

      if (result.success) {
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
        <ErrorMessage message="Please sign in to view your profile" />
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${isPremium ? "bg-gradient-to-br from-[#1a1a0a] via-[#0F1018] to-[#0a1a1a]" : "bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10]"}`}
    >
      <Navbar showAuthButtons={false} />

      <div className="container mx-auto px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`backdrop-blur-xl rounded-2xl p-8 mb-6 ${
              isPremium
                ? "bg-gradient-to-br from-amber-500/10 via-[#0B0C10]/40 to-amber-500/5 border border-amber-500/30"
                : "bg-[#0B0C10]/40 border border-[#00FFFF]/30"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${
                    isPremium
                      ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black"
                      : "bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10]"
                  }`}
                >
                  {profile?.imageUrl ? (
                    <img
                      src={profile.imageUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                  {isPremium && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
                      <Crown className="w-5 h-5 text-black" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-3xl font-bold ${isPremium ? "text-amber-400" : "text-white"}`}>
                      {profile?.username || profile?.firstName || "User"}
                    </h1>
                    {isPremium && <Sparkles className="w-6 h-6 text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-[#888888]">
                    <Mail className="w-4 h-4" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#888888] mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile?.createdAt).toLocaleDateString()}</span>
                  </div>
                  {countryInfo && (
                    <div className="flex items-center gap-2 text-[#888888] mt-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-lg mr-1">{countryInfo.flag}</span>
                      <span>{countryInfo.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {profile?.role === "ADMIN" && (
                      <div className="inline-block px-3 py-1 bg-[#00FFFF]/20 border border-[#00FFFF]/50 rounded-full text-[#00FFFF] text-xs font-semibold">
                        Admin
                      </div>
                    )}
                    {isPremium && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-full text-amber-400 text-xs font-semibold">
                        <Crown className="w-3 h-3" />
                        Premium Member
                      </div>
                    )}
                  </div>
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
                className={`p-2 rounded-lg transition ${
                  isPremium
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    : "bg-[#1A1B23]/60 border border-[#2A2B33] text-[#00FFFF] hover:bg-[#00FFFF]/10"
                }`}
              >
                {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div
                className={`rounded-lg p-4 ${
                  isPremium ? "bg-amber-500/10 border border-amber-500/20" : "bg-[#1A1B23]/60 border border-[#2A2B33]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-6 h-6 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.likesCount}</p>
                    <p className="text-sm text-[#888888]">Movies Liked</p>
                  </div>
                </div>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  isPremium ? "bg-amber-500/10 border border-amber-500/20" : "bg-[#1A1B23]/60 border border-[#2A2B33]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-6 h-6 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.commentsCount}</p>
                    <p className="text-sm text-[#888888]">Comments Posted</p>
                  </div>
                </div>
              </div>
            </div>

            {isPremium && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-amber-400 font-bold">Premium Benefits Active</h3>
                </div>
                <ul className="text-sm text-amber-200/70 space-y-1">
                  <li>• Ad-free viewing experience</li>
                  <li>• Early access to new content</li>
                  <li>• HD streaming quality</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {isEditing && (
            <motion.div
              className={`backdrop-blur-xl rounded-2xl p-8 mb-6 ${
                isPremium
                  ? "bg-gradient-to-br from-amber-500/10 via-[#0B0C10]/40 to-amber-500/5 border border-amber-500/30"
                  : "bg-[#0B0C10]/40 border border-[#00FFFF]/30"
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${isPremium ? "text-amber-400" : "text-white"}`}
              >
                <Edit2 className={`w-5 h-5 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
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
                    className={`w-full px-4 py-3 bg-[#1A1B23]/60 border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-all ${
                      isPremium
                        ? "border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                        : "border-[#2A2B33] focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30"
                    }`}
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
                      className={`w-full px-4 py-3 bg-[#1A1B23]/60 border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-all ${
                        isPremium
                          ? "border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                          : "border-[#2A2B33] focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30"
                      }`}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`w-full px-4 py-3 bg-[#1A1B23]/60 border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-all ${
                        isPremium
                          ? "border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                          : "border-[#2A2B33] focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30"
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-3 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isPremium
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:shadow-xl hover:shadow-amber-500/50"
                      : "bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] hover:shadow-xl hover:shadow-[#00FFFF]/50"
                  }`}
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
          <div
            className={`backdrop-blur-xl rounded-2xl p-8 ${
              isPremium
                ? "bg-gradient-to-br from-amber-500/10 via-[#0B0C10]/40 to-amber-500/5 border border-amber-500/30"
                : "bg-[#0B0C10]/40 border border-[#00FFFF]/30"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center gap-2 ${isPremium ? "text-amber-400" : "text-white"}`}
            >
              <Settings className={`w-5 h-5 ${isPremium ? "text-amber-400" : "text-[#00FFFF]"}`} />
              Account Settings
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg">
                <p className="text-white font-medium mb-1">Account Type</p>
                <p className={`text-sm ${isPremium ? "text-amber-400" : "text-[#888888]"}`}>
                  {profile?.role === "ADMIN" ? "Admin Account" : isPremium ? "Premium Account" : "Free Account"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
