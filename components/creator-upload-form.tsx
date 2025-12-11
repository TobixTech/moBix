"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Upload,
  Film,
  Tv,
  Plus,
  Trash2,
  Loader,
  AlertCircle,
  CheckCircle,
  FileVideo,
  ImagePlusIcon as ImageLucide,
  LinkIcon,
  ArrowLeft,
} from "lucide-react"
import { submitContent, addEpisodesToSubmission, getSubmissionDetails } from "@/lib/creator-actions"
import { toast } from "sonner"

interface CreatorUploadFormProps {
  dailyTracking: {
    uploadsToday: number
    storageUsedToday: number
    uploadLimit: number
    storageLimit: number
  }
  onUploadComplete: () => void
  editingSubmission?: any
  onCancelEdit?: () => void
}

type ContentType = "movie" | "series"
type UploadMode = "url" | "file"

interface Episode {
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  videoFile?: File | null
  isExisting?: boolean // Track existing episodes
}

interface UploadProgress {
  video: number
  thumbnail: number
  episodeUploads: { [key: number]: number }
  isUploading: boolean
  currentStep: string // Track upload progress
  currentEpisode?: number
}

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
]

export function CreatorUploadForm({
  dailyTracking,
  onUploadComplete,
  editingSubmission,
  onCancelEdit,
}: CreatorUploadFormProps) {
  const [contentType, setContentType] = useState<ContentType>("movie")
  const [uploadMode, setUploadMode] = useState<UploadMode>("url")
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    video: 0,
    thumbnail: 0,
    episodeUploads: {},
    isUploading: false,
    currentStep: "",
  })

  // File refs
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const episodeVideoRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Selected files
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")

  // Movie fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")

  // Series fields
  const [totalSeasons, setTotalSeasons] = useState(1)
  const [seriesStatus, setSeriesStatus] = useState("ongoing")
  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      seasonNumber: 1,
      episodeNumber: 1,
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: 0,
      videoFile: null,
    },
  ])
  const [existingEpisodes, setExistingEpisodes] = useState<Episode[]>([])

  useEffect(() => {
    if (editingSubmission) {
      setContentType("series")
      setTitle(editingSubmission.title)
      setDescription(editingSubmission.description)
      setGenre(editingSubmission.genre)
      setYear(editingSubmission.year || new Date().getFullYear())
      setThumbnailUrl(editingSubmission.thumbnailUrl)
      setBannerUrl(editingSubmission.bannerUrl || "")

      const seriesData = editingSubmission.seriesData ? JSON.parse(editingSubmission.seriesData) : { totalSeasons: 1 }
      setTotalSeasons(seriesData.totalSeasons || 1)
      setSeriesStatus(seriesData.status || "ongoing")

      // Load existing episodes
      loadExistingEpisodes(editingSubmission.id)
    }
  }, [editingSubmission])

  const loadExistingEpisodes = async (submissionId: string) => {
    setLoadingExisting(true)
    try {
      const result = await getSubmissionDetails(submissionId)
      if (result.success && result.episodes) {
        const existing = result.episodes.map((ep: any) => ({
          ...ep,
          isExisting: true,
        }))
        setExistingEpisodes(existing)

        // Calculate next episode number
        const maxEpisode = existing.reduce((max: number, ep: any) => Math.max(max, ep.episodeNumber), 0)
        const maxSeason = existing.reduce((max: number, ep: any) => Math.max(max, ep.seasonNumber), 1)

        setEpisodes([
          {
            seasonNumber: maxSeason,
            episodeNumber: maxEpisode + 1,
            title: "",
            description: "",
            videoUrl: "",
            thumbnailUrl: "",
            duration: 0,
            videoFile: null,
          },
        ])
      }
    } catch (error) {
      console.error("Error loading existing episodes:", error)
    }
    setLoadingExisting(false)
  }

  const canUpload = dailyTracking.uploadsToday < dailyTracking.uploadLimit

  // Handle file selection
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
      if (!file.name.match(allowedExtensions)) {
        toast.error("Invalid file type. Allowed: mp4, webm, mkv, avi, mov")
        return
      }
      if (file.size > 10 * 1024 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10GB")
        return
      }
      setSelectedVideoFile(file)
      toast.success(`Video selected: ${file.name}`)
    }
  }

  const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Allowed: jpg, png, webp")
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 15MB")
        return
      }
      setSelectedThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEpisodeVideoFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
      if (!file.name.match(allowedExtensions)) {
        toast.error("Invalid file type. Allowed: mp4, webm, mkv, avi, mov")
        return
      }
      if (file.size > 10 * 1024 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10GB")
        return
      }
      const updated = [...episodes]
      updated[index] = { ...updated[index], videoFile: file }
      setEpisodes(updated)
      toast.success(`Episode ${index + 1} video selected: ${file.name}`)
    }
  }

  // Upload file to API
  const uploadVideoFile = async (file: File, episodeTitle?: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append("video", file)
    formData.append("title", episodeTitle || title)

    try {
      console.log("[v0] Starting video upload:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2) + "MB")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minute timeout

      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Video upload HTTP error:", response.status, errorText)
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Video upload response:", result)

      if (!result.success) {
        throw new Error(result.error || "Video upload failed")
      }

      if (result.warning) {
        toast.warning(result.warning)
      }

      return result.embedUrl
    } catch (error: any) {
      console.error("[v0] Video upload error:", error)
      if (error.name === "AbortError") {
        toast.error("Upload timed out. Try a smaller file or use URL mode.")
      } else {
        toast.error(error.message || "Failed to upload video")
      }
      return null
    }
  }

  const uploadThumbnailFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("thumbnail", file)

    try {
      console.log("[v0] Starting thumbnail upload:", file.name, "Size:", (file.size / 1024).toFixed(2) + "KB")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60 * 1000) // 1 minute timeout

      const response = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Thumbnail upload HTTP error:", response.status, errorText)
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Thumbnail upload response:", result)

      if (!result.success) {
        throw new Error(result.error || "Thumbnail upload failed")
      }

      if (result.warning) {
        toast.warning(result.warning)
      }

      return result.thumbnailUrl
    } catch (error: any) {
      console.error("[v0] Thumbnail upload error:", error)
      if (error.name === "AbortError") {
        toast.error("Upload timed out. Try a smaller file.")
      } else {
        toast.error(error.message || "Failed to upload thumbnail")
      }
      return null
    }
  }

  const addEpisode = () => {
    const lastEpisode = episodes[episodes.length - 1]
    setEpisodes([
      ...episodes,
      {
        seasonNumber: lastEpisode?.seasonNumber || 1,
        episodeNumber: (lastEpisode?.episodeNumber || 0) + 1,
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        duration: 0,
        videoFile: null,
      },
    ])
  }

  const removeEpisode = (index: number) => {
    if (episodes.length > 1) {
      setEpisodes(episodes.filter((_, i) => i !== index))
    }
  }

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const updated = [...episodes]
    updated[index] = { ...updated[index], [field]: value }
    setEpisodes(updated)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setGenre("")
    setYear(new Date().getFullYear())
    setVideoUrl("")
    setThumbnailUrl("")
    setBannerUrl("")
    setSelectedVideoFile(null)
    setSelectedThumbnailFile(null)
    setThumbnailPreview("")
    setTotalSeasons(1)
    setSeriesStatus("ongoing")
    setEpisodes([
      {
        seasonNumber: 1,
        episodeNumber: 1,
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        duration: 0,
        videoFile: null,
      },
    ])
    setExistingEpisodes([])
    if (videoInputRef.current) videoInputRef.current.value = ""
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canUpload) {
      toast.error("Daily upload limit reached")
      return
    }

    if (editingSubmission) {
      await handleAddEpisodes()
      return
    }

    // Validation
    if (title.length < 3) {
      toast.error("Title must be at least 3 characters")
      return
    }
    if (description.length < 20) {
      toast.error("Description must be at least 20 characters")
      return
    }
    if (!genre) {
      toast.error("Please select a genre")
      return
    }

    // Check thumbnail requirement
    if (uploadMode === "url" && !thumbnailUrl) {
      toast.error("Thumbnail URL is required")
      return
    }
    if (uploadMode === "file" && !selectedThumbnailFile) {
      toast.error("Please select a thumbnail image")
      return
    }

    // Check video requirement for movies
    if (contentType === "movie") {
      if (uploadMode === "url" && !videoUrl) {
        toast.error("Video URL is required for movies")
        return
      }
      if (uploadMode === "file" && !selectedVideoFile) {
        toast.error("Please select a video file")
        return
      }
    }

    // Check episodes for series
    if (contentType === "series") {
      const missingEpisodes = episodes.filter((ep) => {
        if (uploadMode === "url") return !ep.videoUrl
        return !ep.videoFile && !ep.videoUrl
      })
      if (missingEpisodes.length > 0) {
        toast.error(
          `Please provide video for all episodes. Missing: Episode ${episodes.findIndex((ep) => (uploadMode === "url" ? !ep.videoUrl : !ep.videoFile && !ep.videoUrl)) + 1}`,
        )
        return
      }
    }

    setLoading(true)
    setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: true, currentStep: "Starting..." })

    let finalVideoUrl = videoUrl
    let finalThumbnailUrl = thumbnailUrl

    try {
      // Upload thumbnail if in file mode
      if (uploadMode === "file" && selectedThumbnailFile) {
        setUploadProgress((prev) => ({ ...prev, currentStep: "Uploading thumbnail...", thumbnail: 10 }))
        toast.info("Uploading thumbnail...")

        const uploadedThumbnailUrl = await uploadThumbnailFile(selectedThumbnailFile)
        if (!uploadedThumbnailUrl) {
          throw new Error("Thumbnail upload failed. Please try again.")
        }
        finalThumbnailUrl = uploadedThumbnailUrl
        setUploadProgress((prev) => ({ ...prev, thumbnail: 100, currentStep: "Thumbnail uploaded!" }))
        toast.success("Thumbnail uploaded!")
      }

      // For movies, upload video file
      if (contentType === "movie" && uploadMode === "file" && selectedVideoFile) {
        setUploadProgress((prev) => ({ ...prev, currentStep: "Uploading video (this may take a while)...", video: 10 }))
        toast.info("Uploading video... This may take a while for large files.")

        const uploadedVideoUrl = await uploadVideoFile(selectedVideoFile)
        if (!uploadedVideoUrl) {
          throw new Error("Video upload failed. Please try again or use URL mode.")
        }
        finalVideoUrl = uploadedVideoUrl
        setUploadProgress((prev) => ({ ...prev, video: 100, currentStep: "Video uploaded!" }))
        toast.success("Video uploaded!")
      }

      // For series, upload episode videos
      const finalEpisodes = [...episodes]
      if (contentType === "series") {
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i]
          if (uploadMode === "file" && ep.videoFile) {
            setUploadProgress((prev) => ({
              ...prev,
              currentStep: `Uploading Episode ${i + 1}...`,
              currentEpisode: i,
              episodeUploads: { ...prev.episodeUploads, [i]: 10 },
            }))
            toast.info(`Uploading Episode ${i + 1} video...`)

            const uploadedUrl = await uploadVideoFile(
              ep.videoFile,
              `${title} - S${ep.seasonNumber}E${ep.episodeNumber}`,
            )
            if (!uploadedUrl) {
              throw new Error(`Episode ${i + 1} video upload failed`)
            }
            finalEpisodes[i] = { ...finalEpisodes[i], videoUrl: uploadedUrl }
            setUploadProgress((prev) => ({
              ...prev,
              episodeUploads: { ...prev.episodeUploads, [i]: 100 },
            }))
            toast.success(`Episode ${i + 1} uploaded!`)
          }
        }
      }

      // Final validation
      if (contentType === "movie" && !finalVideoUrl) {
        throw new Error("Video URL is required for movies")
      }
      if (!finalThumbnailUrl) {
        throw new Error("Thumbnail is required")
      }
      if (contentType === "series") {
        const missingVideos = finalEpisodes.filter((ep) => !ep.videoUrl)
        if (missingVideos.length > 0) {
          throw new Error(
            `Video URL required for all episodes. Missing: Episode ${finalEpisodes.findIndex((ep) => !ep.videoUrl) + 1}`,
          )
        }
      }

      // Submit content
      setUploadProgress((prev) => ({ ...prev, currentStep: "Submitting content..." }))
      console.log("[v0] Submitting content:", { type: contentType, title, genre, year })

      const result = await submitContent({
        type: contentType,
        title,
        description,
        genre,
        year,
        videoUrl: contentType === "movie" ? finalVideoUrl : undefined,
        thumbnailUrl: finalThumbnailUrl,
        bannerUrl: bannerUrl || undefined,
        seriesData:
          contentType === "series"
            ? {
                totalSeasons,
                totalEpisodes: finalEpisodes.length,
                status: seriesStatus,
              }
            : undefined,
        episodes:
          contentType === "series"
            ? finalEpisodes.map((ep) => ({
                seasonNumber: ep.seasonNumber,
                episodeNumber: ep.episodeNumber,
                title: ep.title || `Episode ${ep.episodeNumber}`,
                description: ep.description,
                videoUrl: ep.videoUrl,
                thumbnailUrl: ep.thumbnailUrl,
                duration: ep.duration,
              }))
            : undefined,
      })

      console.log("[v0] Submit result:", result)

      if (result.success) {
        toast.success(result.autoApproved ? "Content published successfully!" : "Content submitted for review!")
        // Reset form
        resetForm()
        onUploadComplete()
      } else {
        throw new Error(result.error || "Failed to submit content")
      }
    } catch (error: any) {
      console.error("[v0] Submit error:", error)
      toast.error(error.message || "Submission failed")
    } finally {
      setLoading(false)
      setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: false, currentStep: "" })
    }
  }

  const handleAddEpisodes = async () => {
    // Validate new episodes
    const validEpisodes = episodes.filter((ep) => ep.videoUrl || ep.videoFile)
    if (validEpisodes.length === 0) {
      toast.error("Please add at least one episode with a video")
      return
    }

    setLoading(true)
    setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: true, currentStep: "Starting..." })

    try {
      const finalEpisodes = [...validEpisodes]

      // Upload video files for episodes
      for (let i = 0; i < finalEpisodes.length; i++) {
        const ep = finalEpisodes[i]
        if (ep.videoFile) {
          setUploadProgress((prev) => ({
            ...prev,
            currentStep: `Uploading Episode ${ep.episodeNumber}...`,
            currentEpisode: i,
            episodeUploads: { ...prev.episodeUploads, [i]: 10 },
          }))
          toast.info(`Uploading Episode ${ep.episodeNumber}...`)

          const uploadedUrl = await uploadVideoFile(ep.videoFile, `${title} - S${ep.seasonNumber}E${ep.episodeNumber}`)
          if (!uploadedUrl) {
            throw new Error(`Episode ${ep.episodeNumber} upload failed`)
          }
          finalEpisodes[i] = { ...finalEpisodes[i], videoUrl: uploadedUrl }
          setUploadProgress((prev) => ({
            ...prev,
            episodeUploads: { ...prev.episodeUploads, [i]: 100 },
          }))
          toast.success(`Episode ${ep.episodeNumber} uploaded!`)
        }
      }

      setUploadProgress((prev) => ({ ...prev, currentStep: "Adding episodes..." }))

      // Submit new episodes
      const result = await addEpisodesToSubmission({
        submissionId: editingSubmission.id,
        episodes: finalEpisodes.map((ep) => ({
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title || `Episode ${ep.episodeNumber}`,
          description: ep.description,
          videoUrl: ep.videoUrl,
          thumbnailUrl: ep.thumbnailUrl, // Keep this in case it's needed for future features
          duration: ep.duration, // Keep this in case it's needed for future features
        })),
      })

      if (result.success) {
        toast.success("Episodes added successfully!")
        onCancelEdit?.() // Close the edit view
        onUploadComplete() // Refresh parent component
      } else {
        throw new Error(result.error || "Failed to add episodes")
      }
    } catch (error: any) {
      console.error("[v0] Add episodes error:", error)
      toast.error(error.message || "Failed to add episodes")
    } finally {
      setLoading(false)
      setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: false, currentStep: "" })
    }
  }

  // This is the part that changed from the original code block.
  // The changes include using a UI framework (like shadcn/ui) for a cleaner look and feel.
  // It also improves the upload progress feedback and adds a dedicated section for adding episodes.

  // Removed the original return statement and replaced it with the new UI structure.
  // The logic remains largely the same, but the presentation is different.

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  // Removed the original return statement and replaced it with the new UI structure.
  // The logic remains largely the same, but the presentation is different.

  return (
    <div className="space-y-6">
      {/* Daily Limits Display */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm text-muted-foreground">Uploads today:</span>
            <span
              className={`ml-2 font-medium ${
                dailyTracking.uploadsToday >= dailyTracking.uploadLimit ? "text-red-500" : "text-primary"
              }`}
            >
              {dailyTracking.uploadsToday}/{dailyTracking.uploadLimit}
            </span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Storage used:</span>
            <span
              className={`ml-2 font-medium ${
                dailyTracking.storageUsedToday >= dailyTracking.storageLimit ? "text-red-500" : "text-primary"
              }`}
            >
              {dailyTracking.storageUsedToday.toFixed(1)}/{dailyTracking.storageLimit} GB
            </span>
          </div>
        </div>
        {!canUpload && (
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Daily limit reached</span>
          </div>
        )}
      </div>

      {/* Edit Mode Header */}
      {editingSubmission && (
        <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
          <div>
            <h3 className="font-medium">Adding episodes to: {editingSubmission.title}</h3>
            <p className="text-sm text-muted-foreground">Existing episodes: {existingEpisodes.length}</p>
          </div>
        </div>
      )}

      {/* Upload Progress Display */}
      {uploadProgress.isUploading && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Loader className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{uploadProgress.currentStep}</span>
          </div>
          {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
            <div className="mt-2">
              <div className="text-sm text-muted-foreground">Thumbnail: {uploadProgress.thumbnail}%</div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress.thumbnail}%` }}
                />
              </div>
            </div>
          )}
          {uploadProgress.video > 0 && uploadProgress.video < 100 && (
            <div className="mt-2">
              <div className="text-sm text-muted-foreground">Video: {uploadProgress.video}%</div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress.video}%` }}
                />
              </div>
            </div>
          )}
          {/* Display progress for individual episode uploads */}
          {uploadProgress.currentEpisode !== undefined &&
            uploadProgress.episodeUploads[uploadProgress.currentEpisode] !== undefined &&
            uploadProgress.episodeUploads[uploadProgress.currentEpisode] < 100 && (
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  Episode {uploadProgress.currentEpisode + 1}:{" "}
                  {uploadProgress.episodeUploads[uploadProgress.currentEpisode]}%
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadProgress.episodeUploads[uploadProgress.currentEpisode]}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!editingSubmission && (
          <>
            {/* Content Type Selector */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setContentType("movie")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                  contentType === "movie"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Film className="h-5 w-5" />
                <span className="font-medium">Movie</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType("series")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                  contentType === "series"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Tv className="h-5 w-5" />
                <span className="font-medium">Series</span>
              </button>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border p-2">
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors ${
                  uploadMode === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Paste URLs
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors ${
                  uploadMode === "file" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </button>
            </div>
          </>
        )}

        {/* Common Fields */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
              disabled={!!editingSubmission}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
              disabled={!!editingSubmission}
              required
            >
              <option value="">Select genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (min 20 characters)"
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
            disabled={!!editingSubmission}
            required
            minLength={20}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value))}
              min={1900}
              max={new Date().getFullYear() + 1}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
              disabled={!!editingSubmission}
            />
          </div>
          {contentType === "series" && !editingSubmission && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={seriesStatus}
                onChange={(e) => setSeriesStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Thumbnail Section - only for new submissions */}
        {!editingSubmission && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Thumbnail</label>
            {uploadMode === "url" ? (
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="Enter thumbnail URL"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
                required
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50"
                >
                  {selectedThumbnailFile ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{selectedThumbnailFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <ImageLucide className="h-6 w-6 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Click to select thumbnail (jpg, png, webp - max 15MB)
                      </span>
                    </>
                  )}
                </button>
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-32 w-auto rounded-lg object-cover"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Video Section for Movies */}
        {contentType === "movie" && !editingSubmission && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Video</label>
            {uploadMode === "url" ? (
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter video embed URL (VOE, etc.)"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
                required
              />
            ) : (
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/x-matroska,.mkv,.avi,.mov"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/50"
                >
                  {selectedVideoFile ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{selectedVideoFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(selectedVideoFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <span className="text-muted-foreground">Click to select video file</span>
                        <p className="text-xs text-muted-foreground">mp4, webm, mkv, avi, mov - max 10GB</p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Episodes Section for Series */}
        {contentType === "series" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Episodes</label>
              <button
                type="button"
                onClick={addEpisode}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add Episode
              </button>
            </div>

            {/* Existing Episodes (Read-only) */}
            {existingEpisodes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Existing Episodes</h4>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border/50 bg-muted/20 p-3">
                  {existingEpisodes.map((ep, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        S{ep.seasonNumber}E{ep.episodeNumber}: {ep.title || `Episode ${ep.episodeNumber}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Episodes */}
            <div className="space-y-4">
              {editingSubmission && <h4 className="text-sm font-medium">New Episodes</h4>}
              {episodes.map((episode, index) => (
                <div key={index} className="rounded-lg border border-border bg-card/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium">
                      S{episode.seasonNumber}E{episode.episodeNumber}
                    </span>
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEpisode(index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      value={episode.seasonNumber}
                      onChange={(e) => updateEpisode(index, "seasonNumber", Number.parseInt(e.target.value))}
                      placeholder="Season"
                      min={1}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <input
                      type="number"
                      value={episode.episodeNumber}
                      onChange={(e) => updateEpisode(index, "episodeNumber", Number.parseInt(e.target.value))}
                      placeholder="Episode"
                      min={1}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={episode.title}
                    onChange={(e) => updateEpisode(index, "title", e.target.value)}
                    placeholder="Episode title (optional)"
                    className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />

                  {/* Episode Video */}
                  <div className="mt-3">
                    {uploadMode === "url" ? (
                      <input
                        type="url"
                        value={episode.videoUrl}
                        onChange={(e) => updateEpisode(index, "videoUrl", e.target.value)}
                        placeholder="Video URL"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        required
                      />
                    ) : (
                      <div>
                        <input
                          ref={(el) => {
                            episodeVideoRefs.current[index] = el
                          }}
                          type="file"
                          accept="video/mp4,video/webm,video/x-matroska,.mkv,.avi,.mov"
                          onChange={(e) => handleEpisodeVideoFileSelect(index, e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => episodeVideoRefs.current[index]?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm transition-colors hover:border-primary hover:bg-muted/50"
                        >
                          {episode.videoFile ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="truncate">{episode.videoFile.name}</span>
                            </div>
                          ) : episode.videoUrl ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>URL provided</span>
                            </div>
                          ) : (
                            <>
                              <FileVideo className="h-5 w-5 text-muted-foreground" />
                              <span className="text-muted-foreground">Select video or enter URL below</span>
                            </>
                          )}
                        </button>
                        {!episode.videoFile && (
                          <input
                            type="url"
                            value={episode.videoUrl}
                            onChange={(e) => updateEpisode(index, "videoUrl", e.target.value)}
                            placeholder="Or paste video URL"
                            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !canUpload}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
            editingSubmission
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
              : contentType === "movie"
                ? "bg-primary hover:shadow-lg hover:shadow-primary/50"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
          }`}
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              {uploadProgress.currentStep || "Processing..."}
            </>
          ) : editingSubmission ? (
            <>
              <Plus className="h-5 w-5" />
              Add Episodes
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Submit for Review
            </>
          )}
        </button>

        {/* API Keys Notice - Removed as it's not part of the updates */}
      </form>
    </div>
  )
}
