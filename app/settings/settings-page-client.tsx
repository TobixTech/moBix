"use client"
import { useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, Shield, Trash2, LogOut, ChevronRight, Loader2, Globe, Check, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { countries } from "@/lib/countries"

interface SettingsPageClientProps {
  userCountry?: string | null
  countryChangedAt?: string | null
}

export default function SettingsPageClient({ userCountry, countryChangedAt }: SettingsPageClientProps) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { toast } = useToast()

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    newReleases: true,
    watchlistReminders: false,
    promotions: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: false,
    watchHistory: true,
    showActivityStatus: false,
  })

  // Country change
  const [country, setCountry] = useState(userCountry || "")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")
  const [savingCountry, setSavingCountry] = useState(false)
  const hasChangedCountry = !!countryChangedAt

  const selectedCountry = countries.find((c) => c.code === country)
  const filteredCountries = countrySearch
    ? countries
        .filter(
          (c) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase()),
        )
        .slice(0, 10)
    : countries.slice(0, 10)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/user/settings")
        const data = await res.json()

        if (data.success && data.settings) {
          if (data.settings.notifications) {
            setNotifications(data.settings.notifications)
          }
          if (data.settings.privacy) {
            setPrivacy(data.settings.privacy)
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setSettingsLoading(false)
      }
    }

    if (isLoaded && user) {
      loadSettings()
    }
  }, [isLoaded, user])

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key]
    const updatedNotifications = { ...notifications, [key]: newValue }

    // Optimistic update
    setNotifications(updatedNotifications)

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "notifications", settings: updatedNotifications }),
      })
      const result = await res.json()

      if (!result.success) {
        // Revert on error
        setNotifications(notifications)
        toast({
          title: "Error",
          description: "Failed to save preference.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Saved",
          description: `${key === "emailUpdates" ? "Email updates" : key === "newReleases" ? "New releases" : key === "watchlistReminders" ? "Watchlist reminders" : "Promotions"} ${newValue ? "enabled" : "disabled"}.`,
        })
      }
    } catch {
      setNotifications(notifications)
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  const handlePrivacyToggle = async (key: keyof typeof privacy) => {
    const newValue = !privacy[key]
    const updatedPrivacy = { ...privacy, [key]: newValue }

    // Optimistic update
    setPrivacy(updatedPrivacy)

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "privacy", settings: updatedPrivacy }),
      })
      const result = await res.json()

      if (!result.success) {
        setPrivacy(privacy)
        toast({
          title: "Error",
          description: "Failed to save setting.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Saved",
          description: `${key === "profileVisibility" ? "Profile visibility" : key === "watchHistory" ? "Watch history" : "Activity status"} ${newValue ? "enabled" : "disabled"}.`,
        })
      }
    } catch {
      setPrivacy(privacy)
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  const handleCountryChange = async (newCountry: string) => {
    if (hasChangedCountry) {
      toast({
        title: "Cannot change country",
        description: "You can only change your country once.",
        variant: "destructive",
      })
      return
    }

    setCountry(newCountry)
    setShowCountryDropdown(false)
    setCountrySearch("")
    setSavingCountry(true)

    try {
      const res = await fetch("/api/user/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: newCountry }),
      })
      const result = await res.json()

      if (result.success) {
        toast({
          title: "Country updated",
          description: "Your country has been saved. This cannot be changed again.",
        })
        // Reload page to reflect the change
        router.refresh()
      } else {
        setCountry(userCountry || "")
        toast({
          title: "Error",
          description: result.error || "Failed to update country.",
          variant: "destructive",
        })
      }
    } catch {
      setCountry(userCountry || "")
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setSavingCountry(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push("/")
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to process request.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
      </div>
    )
  }

  const sections = [
    { id: "notifications", icon: Bell, label: "Notifications", description: "Manage your notification preferences" },
    { id: "privacy", icon: Shield, label: "Privacy", description: "Control your privacy settings" },
    { id: "country", icon: Globe, label: "Country", description: "Your location settings" },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Settings Cards */}
        {sections.map((section) => (
          <Card
            key={section.id}
            className="bg-[#1A1B23] border-[#2A2B33] cursor-pointer hover:border-[#00FFFF]/50 transition-all"
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00FFFF]/10 rounded-lg">
                    <section.icon className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{section.label}</CardTitle>
                    <CardDescription className="text-white/40">{section.description}</CardDescription>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-white/40 transition-transform ${activeSection === section.id ? "rotate-90" : ""}`}
                />
              </div>
            </CardHeader>

            {activeSection === section.id && (
              <CardContent className="pt-4 border-t border-[#2A2B33] space-y-4">
                {settingsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-[#00FFFF] animate-spin" />
                  </div>
                ) : section.id === "notifications" ? (
                  <>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotificationToggle("emailUpdates")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Email Updates</Label>
                        <p className="text-sm text-white/40">Receive updates about your account</p>
                      </div>
                      <Switch
                        checked={notifications.emailUpdates}
                        onCheckedChange={() => handleNotificationToggle("emailUpdates")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotificationToggle("newReleases")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">New Movie Releases</Label>
                        <p className="text-sm text-white/40">Get notified when new movies are added</p>
                      </div>
                      <Switch
                        checked={notifications.newReleases}
                        onCheckedChange={() => handleNotificationToggle("newReleases")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotificationToggle("watchlistReminders")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Watchlist Reminders</Label>
                        <p className="text-sm text-white/40">Remind me about movies in my watchlist</p>
                      </div>
                      <Switch
                        checked={notifications.watchlistReminders}
                        onCheckedChange={() => handleNotificationToggle("watchlistReminders")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotificationToggle("promotions")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Promotional Emails</Label>
                        <p className="text-sm text-white/40">Receive special offers and promotions</p>
                      </div>
                      <Switch
                        checked={notifications.promotions}
                        onCheckedChange={() => handleNotificationToggle("promotions")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </>
                ) : section.id === "privacy" ? (
                  <>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrivacyToggle("profileVisibility")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Public Profile</Label>
                        <p className="text-sm text-white/40">Allow others to see your profile</p>
                      </div>
                      <Switch
                        checked={privacy.profileVisibility}
                        onCheckedChange={() => handlePrivacyToggle("profileVisibility")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrivacyToggle("watchHistory")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Watch History</Label>
                        <p className="text-sm text-white/40">Save your watch history for recommendations</p>
                      </div>
                      <Switch
                        checked={privacy.watchHistory}
                        onCheckedChange={() => handlePrivacyToggle("watchHistory")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrivacyToggle("showActivityStatus")
                      }}
                    >
                      <div>
                        <Label className="text-white cursor-pointer">Activity Status</Label>
                        <p className="text-sm text-white/40">Show when you're active on the platform</p>
                      </div>
                      <Switch
                        checked={privacy.showActivityStatus}
                        onCheckedChange={() => handlePrivacyToggle("showActivityStatus")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </>
                ) : section.id === "country" ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Your Country</Label>
                          <p className="text-sm text-white/40">
                            {hasChangedCountry ? "Country cannot be changed again" : "You can change this once"}
                          </p>
                        </div>
                        {hasChangedCountry && (
                          <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                            Already changed
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => !hasChangedCountry && setShowCountryDropdown(!showCountryDropdown)}
                          disabled={hasChangedCountry || savingCountry}
                          className={`w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-xl text-left text-white flex items-center justify-between ${hasChangedCountry ? "opacity-60 cursor-not-allowed" : "hover:border-[#00FFFF]/50"} transition-colors`}
                        >
                          <span className="flex items-center gap-3">
                            {selectedCountry ? (
                              <>
                                <span className="text-xl">{selectedCountry.flag}</span>
                                <span>{selectedCountry.name}</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-5 h-5 text-white/40" />
                                <span className="text-white/40">Select your country</span>
                              </>
                            )}
                          </span>
                          {savingCountry ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#00FFFF]" />
                          ) : hasChangedCountry ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <ChevronRight
                              className={`w-5 h-5 text-white/40 transition-transform ${showCountryDropdown ? "rotate-90" : ""}`}
                            />
                          )}
                        </button>

                        {showCountryDropdown && !hasChangedCountry && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1B23] border border-[#2A2B33] rounded-xl shadow-xl z-50 max-h-64 overflow-hidden">
                            <div className="p-2 border-b border-[#2A2B33]">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder="Search country..."
                                  className="w-full pl-9 pr-3 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#00FFFF]"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              {filteredCountries.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => handleCountryChange(c.code)}
                                  className={`w-full px-4 py-2.5 text-left hover:bg-[#2A2B33] transition-colors flex items-center gap-3 ${country === c.code ? "bg-[#00FFFF]/10 text-[#00FFFF]" : "text-white"}`}
                                >
                                  <span className="text-lg">{c.flag}</span>
                                  <span>{c.name}</span>
                                </button>
                              ))}
                              {filteredCountries.length === 0 && (
                                <div className="px-4 py-3 text-white/40 text-center">No countries found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            )}
          </Card>
        ))}

        {/* Account Actions */}
        <Card className="bg-[#1A1B23] border-[#2A2B33]">
          <CardHeader>
            <CardTitle className="text-white">Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-[#2A2B33] text-white hover:bg-white/5 hover:text-white bg-transparent"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1A1B23] border-[#2A2B33]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60">
                    This action cannot be undone. All your data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[#2A2B33] text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 text-white hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
