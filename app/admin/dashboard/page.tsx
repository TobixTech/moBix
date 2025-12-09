"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  LayoutDashboard,
  Film,
  Upload,
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Menu,
  X,
  MessageSquare,
  Lock,
  Loader,
  Settings,
  Save,
  Inbox,
  CheckCircle,
  RefreshCw,
  Plus,
  Bell,
  Send,
  Flag,
  Gift,
  Shield,
  Download,
  Shuffle,
  Tv,
  BarChart3,
  Cog,
  Eye,
  Clock,
  TrendingUp,
  AlertTriangle,
  Video,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  getAdminMetrics,
  getTrendingMovies,
  getRecentSignups,
  getAdminMovies,
  getUsers, // Added getUsers import
  uploadMovie,
  updateMovie,
  deleteMovie,
  getAdSettings,
  updateAdSettings,
  deleteComment,
  banUser,
  deleteUser,
  getFeedbackEntries, // Added import
  updateFeedbackStatus, // Added import
  deleteFeedback, // Added import
  getAllCommentsAdmin, // Use the admin function that gets both movie and series comments
  createNotificationForAllUsers, // Added for notification
  createNotificationByEmail, // Added for notification
  getContentReports, // Added import for content reports
  updateReportStatus, // Added import
  deleteContentReport, // Added import
  getPromotionEntries, // Added
  getPromotionSettings, // Added
  getIpBlacklist, // Added
  pickRandomWinner, // Added
  addToBlacklist, // Added
  removeFromBlacklist, // Added
  updatePromotionSettings, // Added
  deletePromotionEntry, // Added
  getAdminSeries, // Added getAdminSeries import
  deleteSeriesComment,
  // Add server actions for analytics and settings if they exist
  getAnalyticsData, // Added for analytics
  getSiteSettings, // Added for settings
  updateSiteSettings, // Added for settings
  getAdminCreators, // Added
  deleteCreator, // Added
  updateCreatorRole, // Added
  createCreator, // Added
  // Add new imports for content submissions
  getContentSubmissions, // Added
  updateSubmissionStatus, // Added
  deleteSubmission, // Added
} from "@/lib/server-actions"

// Import necessary shadcn/ui dialog components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SendNotificationModal } from "@/components/send-notification-modal" // Added SendNotificationModal import
import Link from "next/link" // Added Link import
import Image from "next/image" // Added Image import

// Import toast for notifications
import { toast } from "sonner"
import { COUNTRIES, getCountryByName } from "@/lib/countries" // Added

// Import SendPromoModal
import { SendPromoModal } from "@/components/send-promo-modal" // Added SendPromoModal import
import { AdminSeriesManager } from "@/components/admin-series-manager" // First add the import at the top with other imports

// Import AdminDashboardLoader
import { AdminDashboardLoader } from "@/components/admin-dashboard-loader"

import { AdminCreatorManagementTab } from "@/components/admin-creator-management-tab"
import { AdminContentSubmissionsTab } from "@/components/admin-content-submissions-tab"

// Update AdminTab type
type AdminTab =
  | "overview"
  | "movies"
  | "upload"
  | "users"
  | "comments"
  | "ads"
  | "feedback"
  | "reports"
  | "promotions"
  | "series" // Added "promotions" and "series" to AdminTab type
  | "analytics" // Added
  | "settings" // Added
  | "creators" // Added creators tab
  | "submissions" // Added submissions tab

interface Metric {
  label: string
  value: string
  change: string
}

// ... existing interfaces ...
interface Movie {
  id: number
  title: string
  views?: string
  genre?: string
  uploadDate?: string
  status?: string
  downloadEnabled?: boolean
  downloadUrl?: string
  customVastUrl?: string
  useGlobalAd?: boolean
  description?: string
  thumbnail?: string
  videoUrl?: string
  year?: number
  posterUrl?: string
  videoLink?: string // Added for edit modal compatibility
}

interface Signup {
  id: number
  email: string
  date: string
  firstName?: string // Added for signups
  createdAt?: string // Added for signups
}

interface User {
  id: string
  clerkId: string // Added Clerk ID
  email: string
  dateJoined: string
  role: string
  country?: string | null // Added for users tab
  ipAddress?: string | null // Added for users tab
  ipCount?: number // Added for users tab
  isDuplicateIp?: boolean // Added for users tab
  firstName?: string | null // Added for reports
  lastName?: string | null // Added for reports
  createdAt?: string // Added for getUsers response
  commentsCount?: number // Added for users tab
}

interface AdminComment {
  id: string
  text: string
  rating: number
  contentTitle: string
  contentId: string
  contentType: "movie" | "series"
  userEmail: string
  userName: string
  createdAt: string
}

interface Feedback {
  id: string
  type: string
  title: string
  details: string
  email: string
  status: string
  createdAt: Date
}

type ContentReport = {
  id: string
  reason: string
  description?: string | null
  status: string
  createdAt: Date | string
  email?: string | null
  contentType: "movie" | "series"
  content: {
    id: string
    title: string
    posterUrl?: string | null
  }
  user?: {
    id?: string
    email?: string | null
    firstName?: string | null
  } | null
}

// Add interface for Series if it exists
interface Series {
  id: string
  title: string
  posterUrl?: string
  seasons?: number
  episodesPerSeason?: number
  genre?: string
  status?: string
  // Add other relevant series properties
}

// Define interfaces for Creators and Submissions
interface Creator {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "PENDING" | "APPROVED" | "REJECTED"
  submittedContentCount: number
  createdAt: string
}

interface ContentSubmission {
  id: string
  title: string
  contentType: "movie" | "series"
  status: "PENDING" | "APPROVED" | "REJECTED"
  submittedAt: string
  creator: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export default function AdminDashboard() {
  const [pinVerified, setPinVerified] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinLoading, setPinLoading] = useState(false)

  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const handleAdminLogout = async () => {
    // Use a simple API route for admin logout, assuming it exists
    await fetch("/api/auth/admin-logout", { method: "POST" })
    window.location.href = "/" // Redirect to home or login page
  }

  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [movieSearch, setMovieSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [metrics, setMetrics] = useState<Metric[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [recentSignups, setRecentSignups] = useState<Signup[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [users, setUsers] = useState<User[]>([]) // Changed type to User[] to match potential getUsers response structure, assuming it aligns or is compatible with AdminUser. If not, 'any[]' would be a fallback.
  const [comments, setComments] = useState<AdminComment[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([]) // Added feedback state
  const [contentReports, setContentReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<Series[]>([]) // Added state for TV Series

  // Add new state for promotions
  const [promotionEntries, setPromotionEntries] = useState<any[]>([])
  const [promotionSettings, setPromotionSettings] = useState<any>(null)
  const [ipBlacklist, setIpBlacklist] = useState<any[]>([])
  const [promotionTab, setPromotionTab] = useState<"entries" | "settings" | "blacklist">("entries")
  const [promoCountryFilter, setPromoCountryFilter] = useState("")
  const [promoNetworkFilter, setPromoNetworkFilter] = useState("")
  const [blacklistIp, setBlacklistIp] = useState("")
  const [blacklistReason, setBlacklistReason] = useState("")
  const [randomWinner, setRandomWinner] = useState<any>(null)

  // State for the Send Notification Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false)

  // Add state for send promo modal
  const [showSendPromoModal, setShowSendPromoModal] = useState(false)

  // FIND THE adSettings STATE AROUND LINE 143-165 AND UPDATE IT
  const [adSettings, setAdSettings] = useState({
    horizontalAdCode: "",
    verticalAdCode: "",
    prerollAdCodes: [] as { code: string; name: string }[],
    midrollAdCodes: [] as { code: string; name: string }[],
    smartLinkUrl: "",
    adTimeout: 20,
    skipDelay: 10,
    rotationInterval: 5,
    midrollIntervalMinutes: 20,
    showPrerollAds: true,
    showMidrollAds: false,
    showHomepageAds: true,
    showMovieDetailAds: true,
    showDashboardAds: true,
  })

  const [newAdCode, setNewAdCode] = useState({
    code: "",
    name: "",
  })

  const [newMidrollAdCode, setNewMidrollAdCode] = useState({
    code: "",
    name: "",
  })

  const [formData, setFormData] = useState({
    title: "",
    thumbnail: "",
    videoLink: "",
    description: "",
    genre: "Action",
    releaseDate: "",
    status: "draft",
    downloadEnabled: false,
    downloadUrl: "",
    customVastUrl: "",
    useGlobalAd: true,
  })

  const [notifyOnUpload, setNotifyOnUpload] = useState(true)
  const [selectedUserForNotification, setSelectedUserForNotification] = useState<{
    id: string
    email: string
  } | null>(null)
  const [respondingToFeedback, setRespondingToFeedback] = useState<string | null>(null)
  const [feedbackResponse, setFeedbackResponse] = useState("")

  // ADDED STATE FOR EDIT MODAL
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // ADDED STATES FOR CREATORS AND SUBMISSIONS
  const [creators, setCreators] = useState<Creator[]>([])
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([])
  const [creatorSearch, setCreatorSearch] = useState("")
  const [submissionSearch, setSubmissionSearch] = useState("")
  const [creatorTab, setCreatorTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [submissionTab, setSubmissionTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false)
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null)
  const [newCreatorFormData, setNewCreatorFormData] = useState({ firstName: "", lastName: "", email: "" })

  // ... existing handlers (handlePinSubmit, etc.) ...
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinLoading(true)
    setPinError("")

    try {
      const response = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPinVerified(true)
        setPinInput("")
      } else {
        setPinError(data.error || "Invalid PIN. Please try again.")
      }
    } catch (error) {
      console.error("PIN verification error:", error)
      setPinError("An unexpected error occurred. Please try again.")
    } finally {
      setPinLoading(false)
    }
  }

  // State for editing Series (similar to editing movies)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [editSeriesModalOpen, setEditSeriesModalOpen] = useState(false)

  // Fetch series data
  useEffect(() => {
    async function fetchSeriesData() {
      if (!pinVerified) return
      try {
        // Assuming getAdminSeries() exists
        const seriesData = await getAdminSeries()
        setSeries(seriesData)
      } catch (error) {
        console.error("Error fetching series data:", error)
      }
    }
    fetchSeriesData()
  }, [pinVerified])

  const fetchDashboardData = async () => {
    try {
      const [
        metricsData,
        trendingData,
        signupsData,
        moviesData,
        usersData,
        adSettingsData,
        feedbackData,
        commentsData,
        reportsData,
        seriesData,
        // Add creators and submissions data fetch
        creatorsData,
        submissionsData,
      ] = await Promise.all([
        getAdminMetrics(),
        getTrendingMovies(),
        getRecentSignups(),
        getAdminMovies(),
        getUsers(),
        getAdSettings(),
        getFeedbackEntries(),
        getAllCommentsAdmin(),
        getContentReports(),
        getAdminSeries(),
        // Fetch creators and submissions
        getAdminCreators(),
        getContentSubmissions(),
      ])

      setMetrics(metricsData)
      setTrendingMovies(trendingData as Movie[])
      setRecentSignups(signupsData)
      setMovies(moviesData)
      setUsers(usersData)
      setFeedback(feedbackData)
      setComments(commentsData)
      setContentReports(reportsData as ContentReport[])
      setSeries(seriesData)
      // Set creators and submissions
      setCreators(creatorsData)
      setSubmissions(submissionsData)

      if (adSettingsData) {
        setAdSettings({
          horizontalAdCode: adSettingsData.horizontalAdCode || "",
          verticalAdCode: adSettingsData.verticalAdCode || "",
          prerollAdCodes: adSettingsData.prerollAdCodes ? JSON.parse(adSettingsData.prerollAdCodes) : [],
          midrollAdCodes: adSettingsData.midrollAdCodes ? JSON.parse(adSettingsData.midrollAdCodes) : [],
          smartLinkUrl: adSettingsData.smartLinkUrl || "",
          adTimeout: adSettingsData.adTimeoutSeconds || 20,
          skipDelay: adSettingsData.skipDelaySeconds || 10,
          rotationInterval: adSettingsData.rotationIntervalSeconds || 5,
          midrollIntervalMinutes: adSettingsData.midrollIntervalMinutes || 20,
          showPrerollAds: adSettingsData.showPrerollAds ?? true,
          showMidrollAds: adSettingsData.showMidrollAds ?? false,
          showHomepageAds: adSettingsData.homepageEnabled ?? true,
          showMovieDetailAds: adSettingsData.movieDetailEnabled ?? true,
          showDashboardAds: adSettingsData.dashboardEnabled ?? true,
        })
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error loading admin data:", error)
    }
    setLoading(false)
  }

  // Add siteSettings and analyticsData states
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({})
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [
          metricsData,
          trendingData,
          signupsData,
          moviesData,
          usersData,
          adSettingsData,
          feedbackData,
          commentsData,
          reportsData, // Added reports fetch
          seriesData, // Added series fetch
        ] = await Promise.all([
          getAdminMetrics(),
          getTrendingMovies(),
          getRecentSignups(),
          getAdminMovies(),
          getUsers(),
          getAdSettings(),
          getFeedbackEntries(),
          getAllCommentsAdmin(),
          getContentReports(),
          getAdminSeries(), // Assuming this server action exists
        ])

        setMetrics(metricsData)
        setTrendingMovies(trendingData as Movie[])
        setRecentSignups(signupsData)
        setMovies(moviesData)
        setUsers(usersData)
        setFeedback(feedbackData)
        setComments(commentsData) // Setting comments here
        // Change from:
        // if (reportsData.success) {
        //   setContentReports(reportsData.reports as ContentReport[])
        // }
        // to:
        setContentReports(reportsData as unknown as ContentReport[])
        setSeries(seriesData) // Set series data

        if (adSettingsData) {
          setAdSettings({
            horizontalAdCode: adSettingsData.horizontalAdCode || "",
            verticalAdCode: adSettingsData.verticalAdCode || "",
            // Parse prerollAdCodes from string to array
            prerollAdCodes: adSettingsData.prerollAdCodes ? JSON.parse(adSettingsData.prerollAdCodes) : [],
            // Parse midrollAdCodes from string to array
            midrollAdCodes: adSettingsData.midrollAdCodes ? JSON.parse(adSettingsData.midrollAdCodes) : [],
            smartLinkUrl: adSettingsData.smartLinkUrl || "",
            adTimeout: adSettingsData.adTimeoutSeconds || 20,
            skipDelay: adSettingsData.skipDelaySeconds || 10, // Added skipDelay
            rotationInterval: adSettingsData.rotationIntervalSeconds || 5, // Added rotationInterval
            midrollIntervalMinutes: adSettingsData.midrollIntervalMinutes || 20, // Added midrollIntervalMinutes
            showPrerollAds: adSettingsData.showPrerollAds ?? true,
            showMidrollAds: adSettingsData.showMidrollAds ?? false, // Added showMidrollAds
            showHomepageAds: adSettingsData.homepageEnabled ?? true,
            showMovieDetailAds: adSettingsData.movieDetailEnabled ?? true,
            showDashboardAds: adSettingsData.dashboardEnabled ?? true, // Added showDashboardAds
          })
        }
        setLastRefresh(new Date())
      } catch (error) {
        console.error("Error loading admin data:", error)
      }
      setLoading(false)
    }

    if (pinVerified) {
      loadData()
    }
  }, [pinVerified])

  // Fetch analytics and site settings data
  useEffect(() => {
    async function loadSettingsAndAnalytics() {
      setLoading(true)
      try {
        const [settingsData, analyticsDataResult] = await Promise.all([getSiteSettings(), getAnalyticsData()])

        setSiteSettings(settingsData || {})
        setAnalyticsData(analyticsDataResult || null)
      } catch (error) {
        console.error("Error loading settings or analytics data:", error)
      } finally {
        setLoading(false)
      }
    }
    if (pinVerified) {
      loadSettingsAndAnalytics()
    }
  }, [pinVerified])

  // Fetch promotion data
  useEffect(() => {
    async function fetchPromotionData() {
      if (!pinVerified) return // Only fetch if PIN is verified
      try {
        const [entries, settings, blacklist] = await Promise.all([
          getPromotionEntries(),
          getPromotionSettings(),
          getIpBlacklist(),
        ])
        setPromotionEntries(entries)
        setPromotionSettings(settings)
        setIpBlacklist(blacklist)
      } catch (error) {
        console.error("Error fetching promotion data:", error)
      }
    }
    fetchPromotionData()
  }, [pinVerified]) // Re-fetch if pinVerified changes

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh && pinVerified) {
      interval = setInterval(() => {
        fetchDashboardData()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, pinVerified])

  // HANDLERS FOR CREATORS AND SUBMISSIONS
  const handleCreateCreator = async () => {
    setLoading(true)
    const result = await createCreator(newCreatorFormData)
    if (result.success) {
      toast.success("Creator created successfully!")
      setCreators([...creators, result.creator])
      setIsCreatorModalOpen(false)
      setNewCreatorFormData({ firstName: "", lastName: "", email: "" })
    } else {
      toast.error(result.error || "Failed to create creator")
    }
    setLoading(false)
  }

  const handleUpdateCreatorRole = async (id: string, newRole: "APPROVED" | "REJECTED") => {
    setLoading(true)
    const result = await updateCreatorRole(id, newRole)
    if (result.success) {
      toast.success(`Creator role updated to ${newRole}`)
      setCreators(creators.map((c) => (c.id === id ? { ...c, role: newRole } : c)))
    } else {
      toast.error(result.error || "Failed to update creator role")
    }
    setLoading(false)
  }

  const handleDeleteCreator = async (id: string) => {
    if (!confirm("Are you sure you want to delete this creator?")) return
    setLoading(true)
    const result = await deleteCreator(id)
    if (result.success) {
      toast.success("Creator deleted successfully")
      setCreators(creators.filter((c) => c.id !== id))
    } else {
      toast.error(result.error || "Failed to delete creator")
    }
    setLoading(false)
  }

  const handleUpdateSubmissionStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setLoading(true)
    const result = await updateSubmissionStatus(id, newStatus)
    if (result.success) {
      toast.success(`Submission status updated to ${newStatus}`)
      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status: newStatus } : s)))
      // Potentially update creator's submitted content count if needed
    } else {
      toast.error(result.error || "Failed to update submission status")
    }
    setLoading(false)
  }

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return
    setLoading(true)
    const result = await deleteSubmission(id)
    if (result.success) {
      toast.success("Submission deleted successfully")
      setSubmissions(submissions.filter((s) => s.id !== id))
    } else {
      toast.error(result.error || "Failed to delete submission")
    }
    setLoading(false)
  }

  // ... existing handlers (handleFormChange, handleUpload, handleEdit, handleSaveEdit, handleSaveAdSettings, handleDelete, handleDeleteComment, handleBanUser, handleDeleteUser) ...
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await uploadMovie({
      title: formData.title,
      description: formData.description,
      year: Number.parseInt(formData.releaseDate.split("-")[0]),
      genre: formData.genre,
      posterUrl: formData.thumbnail,
      videoUrl: formData.videoLink,
      isFeatured: formData.status === "published",
      downloadEnabled: formData.downloadEnabled,
      downloadUrl: formData.downloadUrl,
      customVastUrl: formData.customVastUrl,
      useGlobalAd: formData.useGlobalAd,
    })

    if (result.success) {
      if (notifyOnUpload && formData.status === "published") {
        try {
          const notifyResult = await createNotificationForAllUsers(
            `New Movie: ${formData.title}`,
            `${formData.title} is now available to watch on moBix!`,
            "new_movie",
            result.movie?.id,
          )
          if (notifyResult.success) {
            console.log(`Notifications sent to ${notifyResult.count} users`)
          }
        } catch (err) {
          console.error("Failed to send notifications:", err)
        }
      }

      setFormData({
        title: "",
        thumbnail: "",
        videoLink: "",
        description: "",
        genre: "Action",
        releaseDate: "",
        status: "draft",
        downloadEnabled: false,
        downloadUrl: "",
        customVastUrl: "",
        useGlobalAd: true,
      })

      const moviesData = await getAdminMovies()
      setMovies(moviesData)

      alert("Movie uploaded successfully!")
      setActiveTab("movies")
    } else {
      alert("Upload failed. Please check your inputs and try again.")
    }

    setLoading(false)
  }

  const handleEdit = (movie: Movie) => {
    setEditingMovie({
      ...movie,
      title: movie.title || "",
      description: movie.description || "",
      year: movie.year || 2024,
      genre: movie.genre || "Action",
      posterUrl: movie.posterUrl || "",
      videoUrl: movie.videoUrl || "",
      videoLink: movie.videoUrl || "", // Ensure videoLink is populated for the form
      thumbnail: movie.posterUrl || "", // Ensure thumbnail is populated for the form
      downloadEnabled: movie.downloadEnabled || false,
      downloadUrl: movie.downloadUrl || "",
      customVastUrl: movie.customVastUrl || "",
      useGlobalAd: movie.useGlobalAd ?? true,
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMovie) return

    setLoading(true)
    const result = await updateMovie(String(editingMovie.id), {
      title: editingMovie.title,
      description: editingMovie.description || "",
      year: editingMovie.year || 2024,
      genre: editingMovie.genre || "Action",
      posterUrl: editingMovie.thumbnail || editingMovie.posterUrl || "",
      videoUrl: editingMovie.videoLink || editingMovie.videoUrl || "",
      isFeatured: editingMovie.status === "Published",
      downloadEnabled: editingMovie.downloadEnabled || false,
      downloadUrl: editingMovie.downloadUrl || "",
      customVastUrl: editingMovie.customVastUrl || "",
      useGlobalAd: editingMovie.useGlobalAd ?? true,
    })

    if (result.success) {
      const moviesData = await getAdminMovies()
      setMovies(moviesData)
      setEditModalOpen(false)
      setEditingMovie(null)
    } else {
      alert(`Update failed: ${result.error}`)
    }

    setLoading(false)
  }

  // FIND THE NEW ADD BANNER AD STATE AND UPDATE IT
  const handleAddBannerAd = () => {
    if (!newAdCode.code) {
      alert("Please enter an ad code")
      return
    }
    setAdSettings({
      ...adSettings,
      prerollAdCodes: [...adSettings.prerollAdCodes, { ...newAdCode }],
    })
    setNewAdCode({ code: "", name: "" })
  }

  // ADDED HANDLER FOR ADDING MIDROLL AD CODE
  const handleAddMidrollAd = () => {
    if (!newMidrollAdCode.code.trim()) {
      toast.error("Please enter an ad code")
      return
    }
    setAdSettings({
      ...adSettings,
      midrollAdCodes: [...adSettings.midrollAdCodes, { ...newMidrollAdCode }],
    })
    setNewMidrollAdCode({ code: "", name: "" })
    toast.success("Midroll ad code added")
  }

  const handleRemoveBannerAd = (index: number) => {
    setAdSettings({
      ...adSettings,
      prerollAdCodes: adSettings.prerollAdCodes.filter((_, i) => i !== index),
    })
  }

  // ADDED HANDLER FOR REMOVING MIDROLL AD CODE
  const handleRemoveMidrollAd = (index: number) => {
    setAdSettings({
      ...adSettings,
      midrollAdCodes: adSettings.midrollAdCodes.filter((_, i) => i !== index),
    })
    toast.success("Midroll ad code removed")
  }

  const handleSaveAdSettings = async () => {
    setLoading(true)

    const result = await updateAdSettings({
      horizontalAdCode: adSettings.horizontalAdCode,
      verticalAdCode: adSettings.verticalAdCode,
      prerollAdCodes: JSON.stringify(adSettings.prerollAdCodes),
      midrollAdCodes: JSON.stringify(adSettings.midrollAdCodes),
      smartLinkUrl: adSettings.smartLinkUrl,
      adTimeoutSeconds: adSettings.adTimeout,
      skipDelaySeconds: adSettings.skipDelay,
      rotationIntervalSeconds: adSettings.rotationInterval,
      midrollIntervalMinutes: adSettings.midrollIntervalMinutes,
      showPrerollAds: adSettings.showPrerollAds,
      showMidrollAds: adSettings.showMidrollAds,
      homepageEnabled: adSettings.showHomepageAds,
      movieDetailEnabled: adSettings.showMovieDetailAds,
      dashboardEnabled: adSettings.showDashboardAds,
    })

    if (result.success) {
      alert("Ad settings saved successfully!")
    } else {
      alert(`Failed to save ad settings: ${result.error}`)
    }

    setLoading(false)
  }

  const handleDelete = async (movieId: number) => {
    if (!confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    const result = await deleteMovie(String(movieId))

    if (result.success) {
      const moviesData = await getAdminMovies()
      setMovies(moviesData)
    } else {
      alert(`Delete failed: ${result.error}`)
    }

    setLoading(false)
  }

  const handleDeleteComment = async (commentId: string, contentType: "movie" | "series") => {
    try {
      let result
      if (contentType === "series") {
        result = await deleteSeriesComment(commentId)
      } else {
        result = await deleteComment(commentId)
      }

      if (result.success) {
        setComments(comments.filter((c) => c.id !== commentId))
        toast.success("Comment deleted successfully")
      } else {
        toast.error("Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user?")) {
      return
    }

    setLoading(true)
    const result = await banUser(userId)

    if (result.success) {
      const usersData = await getUsers() // Using getUsers
      setUsers(usersData)
      alert("User banned successfully!")
    } else {
      alert(`Failed to ban user: ${result.error}`)
    }

    setLoading(false)
  }

  // Handle role change for users
  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      // Assuming a new server action `updateUserRole` exists
      const response = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const result = await response.json()

      if (result.success) {
        const usersData = await getUsers()
        setUsers(usersData)
        toast.success(`User role updated to ${newRole}`)
      } else {
        toast.error(`Failed to update role: ${result.error}`)
      }
    } catch (error) {
      toast.error("An error occurred while updating role.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (clerkId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    // Assuming `deleteUser` now takes `clerkId`
    const result = await deleteUser(clerkId)

    if (result.success) {
      const usersData = await getUsers() // Using getUsers
      setUsers(usersData)
      alert("User deleted successfully!")
    } else {
      alert(`Failed to delete user: ${result.error}`)
    }

    setLoading(false)
  }

  const handleUpdateFeedback = async (id: string, status: string) => {
    setLoading(true)
    const result = await updateFeedbackStatus(id, status)
    if (result.success) {
      const feedbackData = await getFeedbackEntries()
      setFeedback(feedbackData)
    } else {
      alert("Failed to update status")
    }
    setLoading(false)
  }

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Delete this entry permanently?")) return
    setLoading(true)
    const result = await deleteFeedback(id)
    if (result.success) {
      const feedbackData = await getFeedbackEntries()
      setFeedback(feedbackData)
    } else {
      alert("Failed to delete entry")
    }
    setLoading(false)
  }

  const handleRespondToFeedback = async (feedbackId: string, email: string, type: string) => {
    if (!feedbackResponse.trim()) return

    // Send notification to user
    const notificationTitle = type === "REQUEST" ? "Movie Request Update" : "Report Update"
    await createNotificationByEmail(
      email,
      notificationTitle,
      feedbackResponse,
      type === "REQUEST" ? "request_response" : "report_response",
    )

    // Mark as complete
    await handleUpdateFeedback(feedbackId, "COMPLETE")

    setRespondingToFeedback(null)
    setFeedbackResponse("")
  }

  const handleUpdateReportStatus = async (reportId: string, status: string, userEmail?: string | null) => {
    setLoading(true)
    const result = await updateReportStatus(reportId, status)
    if (result.success) {
      // Send notification to user if email exists and marking as resolved
      if (status === "RESOLVED" && userEmail) {
        await createNotificationByEmail(
          userEmail,
          "Report Resolved",
          "Your content report has been reviewed and resolved. Thank you for helping us maintain quality content.",
          "report_response",
        )
      }
      const reportsData = await getContentReports()
      // Around line 393-395, change:
      // const reportsData = await getAllContentReports()
      // to:
      setContentReports(reportsData as unknown as ContentReport[])
    } else {
      alert("Failed to update report status")
    }
    setLoading(false)
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Delete this report permanently?")) return
    setLoading(true)
    const result = await deleteContentReport(reportId)
    if (result.success) {
      const reportsData = await getContentReports()
      // Around line 393-395, change:
      // const reportsData = await getAllContentReports()
      // to:
      setContentReports(reportsData as unknown as ContentReport[])
    } else {
      alert("Failed to delete report")
    }
    setLoading(false)
  }

  // Promotion handlers
  const handlePickWinner = async () => {
    setLoading(true) // Show loading indicator
    const winner = await pickRandomWinner(promoCountryFilter || undefined)
    setRandomWinner(winner)
    setLoading(false) // Hide loading indicator
  }

  const handleAddToBlacklist = async () => {
    if (!blacklistIp) return
    setLoading(true)
    const result = await addToBlacklist(blacklistIp, blacklistReason, "admin")
    if (result.success) {
      setIpBlacklist([
        ...ipBlacklist,
        { id: result.id, ipAddress: blacklistIp, reason: blacklistReason, blacklistedAt: new Date().toISOString() },
      ]) // Add id from result
      setBlacklistIp("")
      setBlacklistReason("")
      toast.success("IP address added to blacklist")
    } else {
      toast.error(`Failed to add to blacklist: ${result.error}`)
    }
    setLoading(false)
  }

  const handleRemoveFromBlacklist = async (id: string) => {
    setLoading(true)
    const result = await removeFromBlacklist(id)
    if (result.success) {
      setIpBlacklist(ipBlacklist.filter((item) => item.id !== id))
      toast.success("IP address removed from blacklist")
    } else {
      toast.error(`Failed to remove from blacklist: ${result.error}`)
    }
    setLoading(false)
  }

  const handleSavePromotionSettings = async () => {
    if (!promotionSettings) return
    setLoading(true)
    const result = await updatePromotionSettings(promotionSettings)
    if (result.success) {
      toast.success("Promotion settings saved successfully")
    } else {
      toast.error(`Failed to save settings: ${result.error}`)
    }
    setLoading(false)
  }

  const exportPromotionsToCSV = () => {
    const headers = ["Email", "Phone", "Network", "Country", "IP Address", "Date"]
    const rows = promotionEntries.map((e) => [
      e.email,
      e.phone,
      e.network,
      e.country,
      e.ipAddress,
      e.createdAt.split("T")[0],
    ])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promotions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url) // Clean up the URL object
  }

  const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(movieSearch.toLowerCase()))

  // ... existing PIN verification render ...
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative bg-[#0B0C10]/40 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#00FFFF]/10 rounded-full">
                  <Lock className="w-12 h-12 text-[#00FFFF]" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FFFF] via-[#00CCCC] to-[#00FFFF] bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-[#888888] text-sm">Enter your 4-digit PIN to continue</p>
            </div>

            {pinError && (
              <motion.div
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {pinError}
              </motion.div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 4-digit PIN"
                  disabled={pinLoading}
                  className="w-full px-4 py-2 bg-[#1A1B23]/60 border border-[#2A2B33] rounded-lg text-white text-center text-2xl tracking-widest placeholder-[#666666] focus:outline-none focus:border-[#00FFFF] focus:ring-2 focus:ring-[#00FFFF]/30 transition-all disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading || pinInput.length !== 4}
                className="w-full py-3 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded-lg hover:shadow-xl hover:shadow-[#00FFFF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pinLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock Dashboard</span>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return <AdminDashboardLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex flex-col lg:flex-row">
      {/* ... Edit Modal ... */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1A1B23] border border-[#00FFFF]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#00FFFF]">Edit Movie</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Title</label>
              <input
                type="text"
                value={editingMovie?.title || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Year</label>
              <input
                type="number"
                value={editingMovie?.year || 2024}
                onChange={(e) => setEditingMovie({ ...editingMovie!, year: Number.parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Genre</label>
              <select
                value={editingMovie?.genre || "Action"}
                onChange={(e) => setEditingMovie({ ...editingMovie!, genre: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="Action">Action</option>
                <option value="Drama">Drama</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Thriller">Thriller</option>
                <option value="Comedy">Comedy</option>
                <option value="Nollywood">Nollywood</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Status</label>
              <select
                value={editingMovie?.status || "Published"}
                onChange={(e) => setEditingMovie({ ...editingMovie!, status: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Poster URL (Thumbnail)</label>
              <input
                type="url"
                value={editingMovie?.thumbnail || editingMovie?.posterUrl || ""}
                onChange={(e) =>
                  setEditingMovie({ ...editingMovie!, thumbnail: e.target.value, posterUrl: e.target.value })
                }
                placeholder="https://example.com/movie-poster.jpg"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Video URL (Embedded Link)</label>
              <input
                type="url"
                value={editingMovie?.videoLink || editingMovie?.videoUrl || ""}
                onChange={(e) =>
                  setEditingMovie({ ...editingMovie!, videoLink: e.target.value, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/embed/... or direct video URL"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-download"
                checked={editingMovie?.downloadEnabled || false}
                onChange={(e) => setEditingMovie({ ...editingMovie!, downloadEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="edit-download" className="text-white text-sm">
                Enable Download
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Download URL</label>
              <input
                type="url"
                value={editingMovie?.downloadUrl || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, downloadUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
                disabled={!editingMovie?.downloadEnabled}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Custom VAST URL (Optional)</label>
              <input
                type="url"
                value={editingMovie?.customVastUrl || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, customVastUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-global-ad"
                checked={editingMovie?.useGlobalAd ?? true}
                onChange={(e) => setEditingMovie({ ...editingMovie!, useGlobalAd: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="edit-global-ad" className="text-white text-sm">
                Use Global Ad Settings
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2 text-sm">Description</label>
              <textarea
                value={editingMovie?.description || ""}
                onChange={(e) => setEditingMovie({ ...editingMovie!, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      {selectedUserId && (
        <SendNotificationModal
          isOpen={showSendNotificationModal}
          onClose={() => {
            setShowSendNotificationModal(false)
            setSelectedUserId(null)
          }}
          userId={selectedUserId}
          // Removed userEmail prop as it's not directly available in this context for the modal and can be fetched if needed.
          // If the modal specifically needs it, it would need to be passed down or fetched within the modal.
        />
      )}

      {/* Add Creator Modal */}
      <Dialog open={isCreatorModalOpen} onOpenChange={setIsCreatorModalOpen}>
        <DialogContent className="bg-[#1A1B23] border border-[#00FFFF]/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#00FFFF]">Add New Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={newCreatorFormData.firstName}
                onChange={(e) => setNewCreatorFormData({ ...newCreatorFormData, firstName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={newCreatorFormData.lastName}
                onChange={(e) => setNewCreatorFormData({ ...newCreatorFormData, lastName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={newCreatorFormData.email}
                onChange={(e) => setNewCreatorFormData({ ...newCreatorFormData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                placeholder="Enter email address"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsCreatorModalOpen(false)}
                className="px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCreator}
                className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Creator"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <aside
        className={`w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-40" : "hidden lg:flex"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 heartbeat">
            moBix
          </h1>
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {[
            { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
            { id: "movies", label: "Manage Movies", icon: Film },
            { id: "upload", label: "Upload Movie", icon: Upload },
            { id: "series", label: "TV Series", icon: Tv }, // ADDED SERIES TAB
            { id: "users", label: "Manage Users", icon: Users },
            { id: "comments", label: "Comment Moderation", icon: MessageSquare },
            { id: "reports", label: "Content Reports", icon: Flag }, // Added reports tab
            { id: "ads", label: "Ad Management", icon: Settings },
            { id: "promotions", label: "Promotions", icon: Gift }, // Added promotions tab
            { id: "feedback", label: "Feedback & Requests", icon: Inbox },
            { id: "analytics", label: "Analytics", icon: BarChart3 }, // Added
            { id: "settings", label: "Site Settings", icon: Cog }, // Added
            // Add creators and submissions tabs to sidebar navigation
            { id: "creators", label: "Creators", icon: Users },
            { id: "submissions", label: "Submissions", icon: Video },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as AdminTab)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {/* Update the logout button to call the logout API */}
          {/* Removed SignOutButton from Clerk */}
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Add settings tab to mobile bottom tabs and fix padding for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0C10]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1 overflow-x-auto scrollbar-hide">
          {[
            { id: "overview", icon: LayoutDashboard },
            { id: "movies", icon: Film },
            { id: "series", icon: Tv },
            { id: "users", icon: Users },
            { id: "comments", icon: MessageSquare },
            { id: "reports", icon: Flag },
            { id: "ads", icon: Settings },
            { id: "analytics", icon: BarChart3 },
            { id: "settings", icon: Cog },
            // Add creators and submissions to mobile nav
            { id: "creators", icon: Users },
            { id: "submissions", icon: Video },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as AdminTab)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-[48px] ${
                activeTab === id ? "text-cyan-400 bg-cyan-500/10" : "text-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] capitalize truncate">{id}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white/70 hover:text-white">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-xl font-bold text-white capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab.replace("-", " ")}
            </h2>
          </div>
          {/* Add refresh controls to the header area after the sidebar */}
          {/* Find the main content area and add this after the tabs */}
          {/* Refresh Controls - Add this after the tab buttons */}
          <div className="flex items-center gap-4 ml-auto">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#00FFFF]"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => {
                setLoading(true)
                fetchDashboardData()
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2B33] text-white rounded hover:bg-[#3A3B43] transition text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <span className="text-xs text-gray-500">Last: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </header>

        <div className="p-6">
          {/* ... other tabs content ... */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Feedback & Requests</h3>
              <div className="grid gap-4">
                {feedback.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No feedback or requests found.</p>
                ) : (
                  feedback.map((entry) => (
                    <div key={entry.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                entry.type === "REQUEST"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {entry.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                entry.status === "PENDING"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-green-500/10 text-green-400 border-green-500/20"
                              }`}
                            >
                              {entry.status}
                            </span>
                            <span className="text-white/40 text-xs">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white">{entry.title}</h4>
                          {entry.email && <p className="text-cyan-400 text-sm">From: {entry.email}</p>}
                        </div>
                        <div className="flex gap-2">
                          {entry.status === "PENDING" && entry.email && (
                            <button
                              onClick={() => setRespondingToFeedback(entry.id)}
                              className="p-2 hover:bg-cyan-500/10 text-white/50 hover:text-cyan-400 rounded-lg transition-colors"
                              title="Respond & Complete"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {entry.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateFeedback(entry.id, "COMPLETE")}
                              className="p-2 hover:bg-green-500/10 text-white/50 hover:text-green-400 rounded-lg transition-colors"
                              title="Mark as Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFeedback(entry.id)}
                            className="p-2 hover:bg-red-500/10 text-white/50 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {entry.details && <p className="text-white/70 text-sm">{entry.details}</p>}

                      {respondingToFeedback === entry.id && (
                        <div className="mt-4 p-4 bg-white/5 border border-cyan-500/20 rounded-xl space-y-3">
                          <label className="block text-cyan-400 text-sm font-medium">
                            Send response notification to {entry.email}
                          </label>
                          <textarea
                            value={feedbackResponse}
                            onChange={(e) => setFeedbackResponse(e.target.value)}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                            placeholder="Type your response message..."
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setRespondingToFeedback(null)
                                setFeedbackResponse("")
                              }}
                              className="px-4 py-2 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRespondToFeedback(entry.id, entry.email!, entry.type)}
                              disabled={!feedbackResponse.trim()}
                              className="px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Send & Complete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-cyan-500/30 transition-all group"
                  >
                    <h3 className="text-white/50 text-sm font-medium mb-2">{metric.label}</h3>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {metric.value}
                      </div>
                      <div className="text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                        {metric.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Movies */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Film className="w-5 h-5 text-cyan-400" />
                    Trending Now
                  </h3>
                  <div className="space-y-4">
                    {trendingMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-12 h-16 bg-white/10 rounded-lg overflow-hidden relative">
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl || "/placeholder.svg"}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                              No Img
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                            {movie.title}
                          </h4>
                          <p className="text-white/40 text-sm">{movie.genre}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{movie.views}</div>
                          <div className="text-white/30 text-xs">views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Recent Signups
                  </h3>
                  <div className="space-y-4">
                    {recentSignups.map((signup) => (
                      <div
                        key={signup.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {signup.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{signup.email}</h4>
                          <p className="text-white/40 text-sm">Joined {signup.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "movies" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <Search className="w-5 h-5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload New
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Movie</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Genre</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Views</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/60 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredMovies.map((movie) => (
                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{movie.title}</div>
                          </td>
                          <td className="px-6 py-4 text-white/70">{movie.genre}</td>
                          <td className="px-6 py-4 text-white/50">{movie.uploadDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold border ${
                                movie.status === "Published"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }`}
                            >
                              {movie.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-mono">{movie.views}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(movie)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-cyan-400 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(movie.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-8">Upload New Movie</h3>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Movie Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="Enter movie title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Genre</label>
                      <select
                        name="genre"
                        value={formData.genre}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="Action">Action</option>
                        <option value="Drama">Drama</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Nollywood">Nollywood</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Release Date</label>
                      <input
                        type="date"
                        name="releaseDate"
                        value={formData.releaseDate}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                      placeholder="Enter movie description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Thumbnail URL</label>
                      <input
                        type="url"
                        name="thumbnail"
                        value={formData.thumbnail}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="https://..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Video Link (Embed/Direct)</label>
                      <input
                        type="url"
                        name="videoLink"
                        value={formData.videoLink}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>

                  {/* Added Download & Ad Settings to Upload Form */}
                  <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-4">
                    <h4 className="font-medium text-white">Additional Options</h4>

                    <div className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <input
                        type="checkbox"
                        id="notifyOnUpload"
                        checked={notifyOnUpload}
                        onChange={(e) => setNotifyOnUpload(e.target.checked)}
                        className="w-5 h-5 rounded border-cyan-500/30 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="notifyOnUpload" className="text-white flex-1">
                        <span className="font-medium">Notify all users</span>
                        <span className="text-white/50 text-sm block">
                          Send push notification when movie is published
                        </span>
                      </label>
                      <Bell className="w-5 h-5 text-cyan-400" />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="downloadEnabled"
                        checked={formData.downloadEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, downloadEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="downloadEnabled" className="text-white text-sm">
                        Enable Download
                      </label>
                    </div>

                    {formData.downloadEnabled && (
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Download URL</label>
                        <input
                          type="url"
                          name="downloadUrl"
                          value={formData.downloadUrl}
                          onChange={handleFormChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Custom VAST URL (Optional)</label>
                      <input
                        type="url"
                        name="customVastUrl"
                        value={formData.customVastUrl}
                        onChange={handleFormChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="Override global ad setting"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="useGlobalAd"
                        checked={formData.useGlobalAd}
                        onChange={(e) => setFormData((prev) => ({ ...prev, useGlobalAd: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="useGlobalAd" className="text-white text-sm">
                        Use Global Ad Settings
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          title: "",
                          thumbnail: "",
                          videoLink: "",
                          description: "",
                          genre: "Action",
                          releaseDate: "",
                          status: "draft",
                          downloadEnabled: false,
                          downloadUrl: "",
                          customVastUrl: "",
                          useGlobalAd: true,
                        })
                      }
                      className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-all"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? "Uploading..." : "Upload Movie"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search users by email, name, or IP..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <Search className="w-5 h-5 text-white/30 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Email</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Country</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">IP Address</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Role</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Registered</th>
                        <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users
                        .filter(
                          (user) =>
                            user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.ipAddress?.includes(userSearch), // Added IP search
                        )
                        .map((user) => (
                          <tr key={user.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-white">{user.email}</td>
                            <td className="px-4 py-3 text-white">
                              {user.firstName || ""} {user.lastName || ""}
                            </td>
                            <td className="px-4 py-3 text-white">
                              {user.country ? (
                                <span className="flex items-center gap-2">
                                  <span>{getCountryByName(user.country)?.flag || "🌍"}</span>
                                  <span className="text-white/70 text-sm">{user.country}</span>
                                </span>
                              ) : (
                                <span className="text-white/40">-</span>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${user.isDuplicateIp ? "text-red-400" : "text-white/70"}`}>
                              {user.ipAddress ? (
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{user.ipAddress}</span>
                                  {user.ipCount > 1 && (
                                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                      x{user.ipCount}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-white/40">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-bold rounded ${
                                  user.role === "ADMIN"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white/50 text-sm">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : user.dateJoined}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUserId(user.id)
                                    setShowSendNotificationModal(true)
                                  }}
                                  className="p-1.5 hover:bg-[#00FFFF]/10 rounded text-white/50 hover:text-[#00FFFF] transition"
                                  title="Send Notification"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                                {user.ipAddress && user.ipCount > 1 && (
                                  <button
                                    onClick={() => setUserSearch(user.ipAddress || "")}
                                    className="p-1.5 hover:bg-orange-500/10 rounded text-white/50 hover:text-orange-400 transition"
                                    title={`View ${user.ipCount} accounts from this IP`}
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                )}
                                {/* CHANGE START */}
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.clerkId, e.target.value)}
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white"
                                >
                                  <option value="USER">User</option>
                                  <option value="PREMIUM">Premium</option>
                                </select>
                                {/* CHANGE END */}
                                <button
                                  onClick={() => handleDeleteUser(user.clerkId)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-white/50 hover:text-red-400 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab Content */}
          {activeTab === "comments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Comment Moderation</h3>
                <div className="flex items-center gap-4">
                  <span className="text-white/50 text-sm">
                    {comments.filter((c) => c.contentType === "movie").length} movie comments
                  </span>
                  <span className="text-white/50 text-sm">
                    {comments.filter((c) => c.contentType === "series").length} series comments
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No comments found.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white/50" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{comment.userName}</div>
                            <div className="flex items-center gap-2 text-white/40 text-sm">
                              <span>on {comment.contentTitle}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  comment.contentType === "series"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-cyan-500/20 text-cyan-400"
                                }`}
                              >
                                {comment.contentType === "series" ? "Series" : "Movie"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 font-bold flex items-center gap-1">★ {comment.rating}</span>
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.contentType)}
                            className="p-2 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/80 leading-relaxed">{comment.text}</p>
                      <div className="mt-4 text-white/30 text-xs">{comment.createdAt}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-cyan-400" />
                  Ad Configuration
                </h3>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Ad Placement Controls</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-white">Pre-roll Ads</span>
                        <input
                          type="checkbox"
                          checked={adSettings.showPrerollAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showPrerollAds: e.target.checked })}
                          className="w-5 h-5 rounded accent-cyan-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-white">Mid-roll Ads</span>
                        <input
                          type="checkbox"
                          checked={adSettings.showMidrollAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showMidrollAds: e.target.checked })}
                          className="w-5 h-5 rounded accent-cyan-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-white">Homepage Ads</span>
                        <input
                          type="checkbox"
                          checked={adSettings.showHomepageAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showHomepageAds: e.target.checked })}
                          className="w-5 h-5 rounded accent-cyan-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-white">Movie Page Ads</span>
                        <input
                          type="checkbox"
                          checked={adSettings.showMovieDetailAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showMovieDetailAds: e.target.checked })}
                          className="w-5 h-5 rounded accent-cyan-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-white">Dashboard Ads</span>
                        <input
                          type="checkbox"
                          checked={adSettings.showDashboardAds}
                          onChange={(e) => setAdSettings({ ...adSettings, showDashboardAds: e.target.checked })}
                          className="w-5 h-5 rounded accent-cyan-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Pre-roll Banner Ads Section */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-white">Pre-roll Ads</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded ${adSettings.showPrerollAds ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {adSettings.showPrerollAds ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Add pre-roll ad codes. They will rotate based on the interval below.
                    </p>

                    {/* Existing Pre-roll Ads */}
                    {adSettings.prerollAdCodes.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {adSettings.prerollAdCodes.map((ad, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{ad.name || `Ad ${index + 1}`}</p>
                              <p className="text-white/40 text-xs truncate">{ad.code.substring(0, 50)}...</p>
                            </div>
                            <button
                              onClick={() => handleRemoveBannerAd(index)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Pre-roll Ad */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Name (optional)</label>
                        <input
                          type="text"
                          value={newAdCode.name}
                          onChange={(e) => setNewAdCode({ ...newAdCode, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. Google AdSense Unit 1"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Code *</label>
                        <textarea
                          rows={3}
                          value={newAdCode.code}
                          onChange={(e) => setNewAdCode({ ...newAdCode, code: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="Paste your HTML or JS ad code here"
                        />
                      </div>
                      <button
                        onClick={handleAddBannerAd}
                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Pre-roll Ad
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-white">Mid-roll Ads</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded ${adSettings.showMidrollAds ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {adSettings.showMidrollAds ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Mid-roll ads play during video at the configured interval.
                    </p>

                    {/* Mid-roll Interval Setting */}
                    <div className="mb-4">
                      <label className="block text-white/80 text-sm mb-2">Play mid-roll ad every (minutes)</label>
                      <input
                        type="number"
                        value={adSettings.midrollIntervalMinutes}
                        onChange={(e) =>
                          setAdSettings({ ...adSettings, midrollIntervalMinutes: Number(e.target.value) })
                        }
                        className="w-full md:w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                        min="5"
                        max="60"
                      />
                      <p className="text-white/40 text-xs mt-1">
                        Example: 20 means ad plays at 20min, 40min, 60min, etc.
                      </p>
                    </div>

                    {/* Existing Mid-roll Ads */}
                    {adSettings.midrollAdCodes.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {adSettings.midrollAdCodes.map((ad, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{ad.name || `Midroll Ad ${index + 1}`}</p>
                              <p className="text-white/40 text-xs truncate">{ad.code.substring(0, 50)}...</p>
                            </div>
                            <button
                              onClick={() => handleRemoveMidrollAd(index)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Mid-roll Ad */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Name (optional)</label>
                        <input
                          type="text"
                          value={newMidrollAdCode.name}
                          onChange={(e) => setNewMidrollAdCode({ ...newMidrollAdCode, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. Mid-roll Video Ad"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm mb-1">Ad Code *</label>
                        <textarea
                          rows={3}
                          value={newMidrollAdCode.code}
                          onChange={(e) => setNewMidrollAdCode({ ...newMidrollAdCode, code: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                          placeholder="Paste your HTML or JS ad code here"
                        />
                      </div>
                      <button
                        onClick={handleAddMidrollAd}
                        className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Mid-roll Ad
                      </button>
                    </div>
                  </div>

                  {/* Ad Timing Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Ad Duration (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.adTimeout}
                        onChange={(e) => setAdSettings({ ...adSettings, adTimeout: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="10"
                        max="60"
                      />
                      <p className="text-white/40 text-xs mt-1">Auto-skip after this time</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Skip Delay (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.skipDelay}
                        onChange={(e) => setAdSettings({ ...adSettings, skipDelay: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="5"
                        max="30"
                      />
                      <p className="text-white/40 text-xs mt-1">Skip button appears after</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Rotation Interval (seconds)</label>
                      <input
                        type="number"
                        value={adSettings.rotationInterval}
                        onChange={(e) => setAdSettings({ ...adSettings, rotationInterval: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
                        min="3"
                        max="15"
                      />
                      <p className="text-white/40 text-xs mt-1">Change ad every</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Smart Link URL</label>
                    <input
                      type="url"
                      value={adSettings.smartLinkUrl}
                      onChange={(e) => setAdSettings({ ...adSettings, smartLinkUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                      placeholder="https://..."
                    />
                    <p className="text-white/40 text-sm mt-2">
                      Direct link for popunders/smart links on download buttons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Horizontal Ad Code (Fallback)</label>
                      <textarea
                        value={adSettings.horizontalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, horizontalAdCode: e.target.value })}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                        placeholder="<!-- HTML/JS Code -->"
                      />
                      <p className="text-white/40 text-xs mt-1">Used if no banner images added</p>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Vertical Ad Code</label>
                      <textarea
                        value={adSettings.verticalAdCode}
                        onChange={(e) => setAdSettings({ ...adSettings, verticalAdCode: e.target.value })}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                        placeholder="<!-- HTML/JS Code -->"
                      />
                    </div>
                  </div>

                  {/* Toggles for Ad Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show-preroll-ads"
                        checked={adSettings.showPrerollAds}
                        onChange={(e) => setAdSettings({ ...adSettings, showPrerollAds: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="show-preroll-ads" className="text-white text-sm">
                        Show Pre-roll Ads
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show-midroll-ads"
                        checked={adSettings.showMidrollAds}
                        onChange={(e) => setAdSettings({ ...adSettings, showMidrollAds: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="show-midroll-ads" className="text-white text-sm">
                        Show Midroll Ads
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show-homepage-ads"
                        checked={adSettings.showHomepageAds}
                        onChange={(e) => setAdSettings({ ...adSettings, showHomepageAds: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="show-homepage-ads" className="text-white text-sm">
                        Show Homepage Ads
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show-movie-detail-ads"
                        checked={adSettings.showMovieDetailAds}
                        onChange={(e) => setAdSettings({ ...adSettings, showMovieDetailAds: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="show-movie-detail-ads" className="text-white text-sm">
                        Show Movie Detail Ads
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show-dashboard-ads"
                        checked={adSettings.showDashboardAds}
                        onChange={(e) => setAdSettings({ ...adSettings, showDashboardAds: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                      />
                      <label htmlFor="show-dashboard-ads" className="text-white text-sm">
                        Show Dashboard Ads
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSaveAdSettings}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update reports tab to handle contentType and content structure */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Content Reports</h3>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">
                    {contentReports.filter((r) => r.status === "PENDING").length} pending
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {contentReports.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <Flag className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">No content reports found.</p>
                    <p className="text-white/30 text-sm mt-2">Reports from users will appear here.</p>
                  </div>
                ) : (
                  contentReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Content Poster */}
                        <div className="flex-shrink-0">
                          <Image
                            src={report.content?.posterUrl || "/placeholder.svg?height=120&width=80"}
                            alt={report.content?.title || "Content"}
                            width={80}
                            height={120}
                            className="rounded-lg object-cover"
                          />
                        </div>

                        {/* Report Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {/* Content type badge */}
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    report.contentType === "series"
                                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  }`}
                                >
                                  {report.contentType === "series" ? "Series" : "Movie"}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold border ${
                                    report.status === "PENDING"
                                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                      : report.status === "RESOLVED"
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                  }`}
                                >
                                  {report.status}
                                </span>
                                <span className="text-white/40 text-xs">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="text-lg font-bold text-white mb-1">
                                <Link
                                  href={
                                    report.contentType === "series"
                                      ? `/series/${report.content?.id}`
                                      : `/movie/${report.content?.id}`
                                  }
                                  className="hover:text-cyan-400 transition-colors"
                                >
                                  {report.content?.title || "Unknown Content"}
                                </Link>
                              </h4>
                              <p className="text-red-400 font-medium text-sm mb-2">
                                Reason: {report.reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              {report.description && <p className="text-white/70 text-sm mb-2">{report.description}</p>}
                              {report.user && (
                                <p className="text-cyan-400 text-sm">
                                  Reported by:{" "}
                                  {report.user.firstName || report.user.email || report.email || "Anonymous"}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 flex-shrink-0">
                              {report.status === "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleUpdateReportStatus(report.id, "RESOLVED", report.user?.email || report.email)
                                  }
                                  className="p-2 hover:bg-green-500/10 text-white/50 hover:text-green-400 rounded-lg transition-colors"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 hover:bg-red-500/10 text-white/50 hover:text-red-400 rounded-lg transition-colors"
                                title="Delete Report"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Promotions Tab Content */}
          {activeTab === "promotions" && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="flex gap-2 border-b border-white/10 pb-4">
                {[
                  { id: "entries", label: "Entries", icon: Users },
                  { id: "settings", label: "Settings", icon: Settings },
                  { id: "blacklist", label: "Blacklist", icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPromotionTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      promotionTab === tab.id
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Entries Tab */}
              {promotionTab === "entries" && (
                <div className="space-y-4">
                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                      <select
                        value={promoCountryFilter}
                        onChange={(e) => setPromoCountryFilter(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      >
                        <option value="">All Countries</option>
                        {COUNTRIES.slice(0, 20).map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={promoNetworkFilter}
                        onChange={(e) => setPromoNetworkFilter(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      >
                        <option value="">All Networks</option>
                        <option value="MTN">MTN</option>
                        <option value="Airtel">Airtel</option>
                        <option value="Glo">Glo</option>
                        <option value="9mobile">9mobile</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSendPromoModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition"
                      >
                        <Send className="w-4 h-4" />
                        Send Direct
                      </button>
                      <button
                        onClick={handlePickWinner}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition"
                      >
                        <Shuffle className="w-4 h-4" />
                        Pick Winner
                      </button>
                      <button
                        onClick={exportPromotionsToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Winner Display */}
                  {randomWinner && (
                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
                      <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-purple-400" />
                        Random Winner Selected!
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-white/50">Email:</span>{" "}
                          <span className="text-white">{randomWinner.email}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Phone:</span>{" "}
                          <span className="text-white">{randomWinner.phone}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Network:</span>{" "}
                          <span className="text-white">{randomWinner.network}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Country:</span>{" "}
                          <span className="text-white">{randomWinner.country}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entries Table */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Email</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Phone</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Network</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Country</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">IP Address</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Date</th>
                            <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {promotionEntries
                            .filter((e) => !promoCountryFilter || e.country === promoCountryFilter)
                            .filter((e) => !promoNetworkFilter || e.network === promoNetworkFilter)
                            .map((entry) => (
                              <tr key={entry.id} className="hover:bg-white/5">
                                <td
                                  className={`px-4 py-3 ${entry.isDuplicateEmail ? "text-orange-400" : "text-white"}`}
                                >
                                  {entry.email}
                                  {entry.emailCount > 1 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                      x{entry.emailCount}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-white">{entry.phone}</td>
                                <td className="px-4 py-3 text-white">{entry.network}</td>
                                <td className="px-4 py-3 text-white">
                                  {getCountryByName(entry.country)?.flag} {entry.country}
                                </td>
                                <td className={`px-4 py-3 ${entry.isDuplicateIp ? "text-red-400" : "text-white/70"}`}>
                                  {entry.ipAddress}
                                  {entry.ipCount > 1 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                      x{entry.ipCount}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-white/50">{entry.createdAt.split("T")[0]}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setBlacklistIp(entry.ipAddress)
                                        setPromotionTab("blacklist")
                                      }}
                                      className="p-1.5 hover:bg-red-500/10 rounded text-white/50 hover:text-red-400 transition"
                                      title="Blacklist IP"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deletePromotionEntry(entry.id)}
                                      className="p-1.5 hover:bg-red-500/10 rounded text-white/50 hover:text-red-400 transition"
                                      title="Delete Entry"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-white/40 text-sm">
                    Total entries: {promotionEntries.length} |<span className="text-red-400"> Red = Duplicate IP</span>{" "}
                    |<span className="text-orange-400"> Orange = Duplicate Email</span>
                  </p>
                </div>
              )}

              {/* Settings Tab */}
              {promotionTab === "settings" && promotionSettings && (
                <div className="space-y-6 max-w-2xl">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <h4 className="text-white font-medium">Promotion Active</h4>
                      <p className="text-white/50 text-sm">Show promotion modal to users</p>
                    </div>
                    <button
                      onClick={() =>
                        setPromotionSettings({ ...promotionSettings, isActive: !promotionSettings.isActive })
                      }
                      className={`w-14 h-8 rounded-full transition-all ${
                        promotionSettings.isActive ? "bg-green-500" : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full transition-all ${
                          promotionSettings.isActive ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enabled Countries */}
                  <div>
                    <label className="block text-white font-medium mb-2">Enabled Countries</label>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES.slice(0, 20).map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            const countries = promotionSettings.enabledCountries || []
                            if (countries.includes(country.name)) {
                              setPromotionSettings({
                                ...promotionSettings,
                                enabledCountries: countries.filter((c: string) => c !== country.name),
                              })
                            } else {
                              setPromotionSettings({
                                ...promotionSettings,
                                enabledCountries: [...countries, country.name],
                              })
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition ${
                            promotionSettings.enabledCountries?.includes(country.name)
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          {country.flag} {country.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modal Text Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Headline</label>
                      <input
                        type="text"
                        value={promotionSettings.headline}
                        onChange={(e) => setPromotionSettings({ ...promotionSettings, headline: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Subtext</label>
                      <input
                        type="text"
                        value={promotionSettings.subtext}
                        onChange={(e) => setPromotionSettings({ ...promotionSettings, subtext: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Success Message</label>
                      <input
                        type="text"
                        value={promotionSettings.successMessage}
                        onChange={(e) => setPromotionSettings({ ...promotionSettings, successMessage: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePromotionSettings}
                    className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
                  >
                    Save Settings
                  </button>
                </div>
              )}

              {/* Blacklist Tab */}
              {promotionTab === "blacklist" && (
                <div className="space-y-6">
                  {/* Add to Blacklist */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-white font-medium mb-4">Add to Blacklist</h4>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={blacklistIp}
                        onChange={(e) => setBlacklistIp(e.target.value)}
                        placeholder="IP Address"
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                      />
                      <input
                        type="text"
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                      />
                      <button
                        onClick={handleAddToBlacklist}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Blacklist Table */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">IP Address</th>
                          <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Reason</th>
                          <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-white/60 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {ipBlacklist.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-white font-mono">{item.ipAddress}</td>
                            <td className="px-4 py-3 text-white/70">{item.reason || "-"}</td>
                            <td className="px-4 py-3 text-white/50">{item.blacklistedAt.split("T")[0]}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleRemoveFromBlacklist(item.id)}
                                className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {ipBlacklist.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                              No blacklisted IPs
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TV Series Tab Content */}
          {activeTab === "series" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">TV Series Management</h3>
              <AdminSeriesManager /> {/* Find the series tab content and replace it with AdminSeriesManager */}
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Analytics Dashboard</h3>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <span className="text-white/70 text-sm">Total Views</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analyticsData?.views?.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-white/70 text-sm">Total Users</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analyticsData?.users?.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Film className="w-5 h-5 text-green-400" />
                    <span className="text-white/70 text-sm">Total Movies</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analyticsData?.movies?.toLocaleString() || "0"}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Tv className="w-5 h-5 text-orange-400" />
                    <span className="text-white/70 text-sm">Total Series</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analyticsData?.series?.toLocaleString() || "0"}</p>
                </div>
              </div>

              {/* Trending Content */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Trending Movies
                </h4>
                <div className="space-y-3">
                  {analyticsData?.trendingMovies?.slice(0, 5).map((movie: any, index: number) => (
                    <div key={movie.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="text-2xl font-bold text-white/30 w-8">#{index + 1}</span>
                      <Image
                        src={movie.posterUrl || "/placeholder.svg?height=60&width=40"}
                        alt={movie.title}
                        width={40}
                        height={60}
                        className="rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{movie.title}</p>
                        <p className="text-white/50 text-sm">{movie.views?.toLocaleString() || 0} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Recent Signups
                </h4>
                <div className="space-y-2">
                  {analyticsData?.recentSignups?.slice(0, 10).map((signup: any) => (
                    <div key={signup.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {signup.firstName?.[0] || signup.email?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{signup.firstName || "User"}</p>
                          <p className="text-white/50 text-xs">{signup.email}</p>
                        </div>
                      </div>
                      <span className="text-white/40 text-xs">{new Date(signup.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6 pb-24 lg:pb-6">
              <h3 className="text-2xl font-bold text-white">Site Settings</h3>

              {/* General Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Cog className="w-5 h-5 text-cyan-400" />
                  General Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-white/50 text-sm">Temporarily disable the site for maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                      <input
                        type="checkbox"
                        checked={siteSettings.maintenanceMode || false}
                        onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Allow New Registrations</p>
                      <p className="text-white/50 text-sm">Enable or disable new user signups</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                      <input
                        type="checkbox"
                        checked={siteSettings.allowRegistrations ?? true}
                        onChange={(e) => setSiteSettings({ ...siteSettings, allowRegistrations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Enable Comments</p>
                      <p className="text-white/50 text-sm">Allow users to comment on content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                      <input
                        type="checkbox"
                        checked={siteSettings.enableComments ?? true}
                        onChange={(e) => setSiteSettings({ ...siteSettings, enableComments: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Enable Downloads</p>
                      <p className="text-white/50 text-sm">Allow users to download content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                      <input
                        type="checkbox"
                        checked={siteSettings.enableDownloads ?? true}
                        onChange={(e) => setSiteSettings({ ...siteSettings, enableDownloads: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                  Cache Management
                </h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toast.success("Page cache cleared")}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 text-sm"
                  >
                    Clear Page Cache
                  </button>
                  <button
                    onClick={() => toast.success("Image cache cleared")}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 text-sm"
                  >
                    Clear Image Cache
                  </button>
                  <button
                    onClick={() => toast.success("All caches cleared")}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm"
                  >
                    Clear All Cache
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 md:p-6">
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-500/10 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Reset All Statistics</p>
                      <p className="text-red-400/70 text-sm">This will reset all view counts and analytics data</p>
                    </div>
                    <button
                      onClick={() => toast.error("This action is disabled for safety")}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm self-start sm:self-center"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button - Fixed and visible on mobile */}
              <div className="flex justify-center sm:justify-end pt-4 pb-4">
                <button
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const result = await updateSiteSettings(siteSettings)
                      if (result.success) {
                        toast.success("Settings saved successfully!")
                      } else {
                        toast.error(result.error || "Failed to save settings")
                      }
                    } catch (error) {
                      toast.error("Failed to save settings")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Creators Tab Content */}
          {activeTab === "creators" && <AdminCreatorManagementTab />}

          {/* Content Submissions Tab Content */}
          {activeTab === "submissions" && <AdminContentSubmissionsTab />}
        </div>
      </main>

      {/* Add the modal at the end of the component before closing tags */}
      <SendPromoModal isOpen={showSendPromoModal} onClose={() => setShowSendPromoModal(false)} />
    </div>
  )
}
