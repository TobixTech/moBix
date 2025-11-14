"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Heart, MessageSquare, Edit2, Save, X, Settings } from 'lucide-react'
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getUserProfile, updateUserProfile, getUserStats } from "@/lib/server-actions"
import LoadingSpinner from "@/components/loading-spinner"
import ErrorMessage from "@/components/error-message"

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ likesCount: 0, commentsCount: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
  })

  useEffect(() => {
    if (isLoaded && clerkUser) {
      loadProfile()
    }
  }, [isLoaded, clerkUser])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const result = await getUserProfile()
      
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
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (err) {
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

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
                    <img src={profile.imageUrl || "/placeholder.svg"} alt="Profile" className="w-full h-full rounded-full object-cover" />
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
                    <span>Joined {new Date(profile?.createdAt).toLocaleDateString()}</span>
                  </div>
                  {profile?.role === "ADMIN" && (
                    <div className="mt-2 inline-block px-3 py-1 bg-[#00FFFF]/20 border border-[#00FFFF]/50 rounded-full text-[#00FFFF] text-xs font-semibold">
                      Admin
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false)
                    setFormData({
                      username: profile?.username || "",
                      firstName: profile?.firstName || "",
                      lastName: profile?.lastName || "",
                    })
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

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <LoadingSpinner />
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
                <p className="text-sm text-[#888888]">{profile?.role === "ADMIN" ? "Admin Account" : "User Account"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
