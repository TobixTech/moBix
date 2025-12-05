"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Bell, Shield, Palette, Trash2, Save, Loader2, Check, Globe, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  updateUserProfile,
  saveUserSettings,
  getUserSettings,
  updateUserCountry,
  getCurrentUserDetails,
} from "@/lib/server-actions"
import { useClerk } from "@clerk/nextjs"
import { COUNTRIES } from "@/lib/countries"

interface SettingsPageClientProps {
  user: {
    id: string
    email: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string
  } | null
}

export default function SettingsPageClient({ user }: SettingsPageClientProps) {
  const { toast } = useToast()
  const { signOut } = useClerk()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [canChangeCountry, setCanChangeCountry] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [savingCountry, setSavingCountry] = useState(false)
  const [showCountrySelect, setShowCountrySelect] = useState(false)

  const [profile, setProfile] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    newReleases: true,
    watchlistReminders: false,
    promotions: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    watchHistory: true,
    showActivityStatus: false,
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const [notifResult, privacyResult, userDetails] = await Promise.all([
          getUserSettings("notifications"),
          getUserSettings("privacy"),
          getCurrentUserDetails(),
        ])

        if (notifResult.success && notifResult.settings) {
          setNotifications(notifResult.settings as typeof notifications)
        }

        if (privacyResult.success && privacyResult.settings) {
          setPrivacy(privacyResult.settings as typeof privacy)
        }

        if (userDetails) {
          setUserCountry(userDetails.country || null)
          setCanChangeCountry(!userDetails.countryChangedAt)
          setSelectedCountry(userDetails.country || "")
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const result = await updateUserProfile(profile)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile.",
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
      setSaving(false)
    }
  }

  const handleChangeCountry = async () => {
    if (!selectedCountry || selectedCountry === userCountry) return

    setSavingCountry(true)
    try {
      const result = await updateUserCountry(selectedCountry)
      if (result.success) {
        setUserCountry(selectedCountry)
        setCanChangeCountry(false)
        setShowCountrySelect(false)
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

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    try {
      const result = await saveUserSettings({ type: "notifications", settings: notifications })
      if (result.success) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save preferences.",
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
      setSavingNotifications(false)
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      const result = await saveUserSettings({ type: "privacy", settings: privacy })
      if (result.success) {
        toast({
          title: "Privacy Settings Saved",
          description: "Your privacy settings have been updated.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save settings.",
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
      setSavingPrivacy(false)
    }
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Contact Support",
      description: "Please contact support to delete your account.",
    })
  }

  const countryInfo = userCountry ? COUNTRIES.find((c) => c.name === userCountry || c.code === userCountry) : null

  return (
    <div className="py-8">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-white mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Settings
      </motion.h1>
      <p className="text-white/60 mb-8">Manage your account settings and preferences</p>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0B0C10]">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0B0C10]"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0B0C10]">
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-[#0B0C10]"
          >
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-white/60">
                Update your personal information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Username
                </Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Choose a username"
                />
                <p className="text-sm text-white/40">This is how others will see you on moBix</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-white/5 border-white/10 text-white/60"
                />
                <p className="text-sm text-white/40">Email cannot be changed here. Contact support for assistance.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Country
                </Label>

                {loadingSettings ? (
                  <div className="flex items-center gap-2 text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        {countryInfo ? (
                          <>
                            <span className="text-xl">{countryInfo.flag}</span>
                            <span className="text-white">{countryInfo.name}</span>
                          </>
                        ) : (
                          <span className="text-white/60">Not set</span>
                        )}
                      </div>

                      {canChangeCountry && !showCountrySelect && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCountrySelect(true)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Change
                        </Button>
                      )}
                    </div>

                    {showCountrySelect && canChangeCountry && (
                      <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          You can only change your country once
                        </div>
                        <select
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                        >
                          <option value="">Select country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleChangeCountry}
                            disabled={savingCountry || !selectedCountry}
                            className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10]"
                          >
                            {savingCountry ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Confirm Change"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCountrySelect(false)}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {!canChangeCountry && (
                      <p className="text-sm text-white/40">
                        Country has already been changed and cannot be modified again.
                      </p>
                    )}
                  </>
                )}
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-white/60">Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Updates</Label>
                      <p className="text-sm text-white/40">Receive updates about your account</p>
                    </div>
                    <Switch
                      checked={notifications.emailUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">New Releases</Label>
                      <p className="text-sm text-white/40">Get notified when new movies are added</p>
                    </div>
                    <Switch
                      checked={notifications.newReleases}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newReleases: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Watchlist Reminders</Label>
                      <p className="text-sm text-white/40">Remind me about movies in my watchlist</p>
                    </div>
                    <Switch
                      checked={notifications.watchlistReminders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, watchlistReminders: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Promotional Emails</Label>
                      <p className="text-sm text-white/40">Receive special offers and promotions</p>
                    </div>
                    <Switch
                      checked={notifications.promotions}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                    />
                  </div>

                  <Button
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications}
                    className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
                  >
                    {savingNotifications ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Privacy & Security</CardTitle>
              <CardDescription className="text-white/60">
                Manage your privacy settings and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Profile Visibility</Label>
                      <p className="text-sm text-white/40">Allow others to see your profile</p>
                    </div>
                    <Switch
                      checked={privacy.profileVisibility}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisibility: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Watch History</Label>
                      <p className="text-sm text-white/40">Save your watch history for recommendations</p>
                    </div>
                    <Switch
                      checked={privacy.watchHistory}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, watchHistory: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Show Activity Status</Label>
                      <p className="text-sm text-white/40">Show when you're online</p>
                    </div>
                    <Switch
                      checked={privacy.showActivityStatus}
                      onCheckedChange={(checked) => setPrivacy({ ...privacy, showActivityStatus: checked })}
                    />
                  </div>

                  <Button
                    onClick={handleSavePrivacy}
                    disabled={savingPrivacy}
                    className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] font-semibold"
                  >
                    {savingPrivacy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Privacy Settings
                      </>
                    )}
                  </Button>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-white font-medium mb-4">Account Actions</h3>

                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10 justify-start bg-transparent"
                        onClick={() => signOut()}
                      >
                        Sign Out of All Devices
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 justify-start bg-transparent"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Appearance</CardTitle>
              <CardDescription className="text-white/60">Customize how moBix looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-4 block">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 rounded-lg border-2 border-[#00FFFF] bg-[#0B0C10] text-center">
                    <div className="w-8 h-8 rounded-full bg-[#0B0C10] border border-white/20 mx-auto mb-2" />
                    <span className="text-white text-sm">Dark</span>
                  </button>
                  <button className="p-4 rounded-lg border border-white/20 bg-white/5 text-center opacity-50 cursor-not-allowed">
                    <div className="w-8 h-8 rounded-full bg-white mx-auto mb-2" />
                    <span className="text-white/60 text-sm">Light</span>
                    <p className="text-xs text-white/40">Coming Soon</p>
                  </button>
                  <button className="p-4 rounded-lg border border-white/20 bg-white/5 text-center opacity-50 cursor-not-allowed">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-[#0B0C10] mx-auto mb-2" />
                    <span className="text-white/60 text-sm">Auto</span>
                    <p className="text-xs text-white/40">Coming Soon</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Autoplay Previews</Label>
                  <p className="text-sm text-white/40">Automatically play movie previews on hover</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Reduce Motion</Label>
                  <p className="text-sm text-white/40">Minimize animations and transitions</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
