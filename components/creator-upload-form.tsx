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
  X,
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

interface FileUploadStatus {
  file: File | null
  status: "idle" | "uploading" | "success" | "error"
  progress: number
  resultUrl: string | null
  error: string | null
}

interface Episode {
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  videoFile?: File | null
  videoUploadStatus?: FileUploadStatus // Track upload status per episode
  isExisting?: boolean
}

interface UploadProgress {
  video: number
  thumbnail: number
  episodeUploads: { [key: number]: number }
  isUploading: boolean
  currentStep: string
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

  const [videoUploadStatus, setVideoUploadStatus] = useState<FileUploadStatus>({
    file: null,
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState<FileUploadStatus>({
    file: null,
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })

  // Selected files (kept for backward compatibility)
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
      videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
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
            videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
          },
        ])
      }
    } catch (error) {
      console.error("Error loading existing episodes:", error)
    }
    setLoadingExisting(false)
  }

  const canUpload = dailyTracking.uploadsToday < dailyTracking.uploadLimit

  const uploadVideoFile = async (file: File, episodeTitle?: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append("video", file)
    formData.append("title", episodeTitle || title || file.name)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Video upload failed")
      }

      return result.embedUrl
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Upload timed out")
      }
      throw error
    }
  }

  const uploadThumbnailFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("thumbnail", file)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60 * 1000)

      const response = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Thumbnail upload failed")
      }

      return result.thumbnailUrl
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Upload timed out")
      }
      throw error
    }
  }

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    setVideoUploadStatus({
      file,
      status: "uploading",
      progress: 10,
      resultUrl: null,
      error: null,
    })

    toast.info(`Uploading video: ${file.name}...`)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setVideoUploadStatus((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + 5, 90),
      }))
    }, 500)

    try {
      const resultUrl = await uploadVideoFile(file)
      clearInterval(progressInterval)

      if (resultUrl) {
        setVideoUploadStatus({
          file,
          status: "success",
          progress: 100,
          resultUrl,
          error: null,
        })
        setVideoUrl(resultUrl) // Store the URL for form submission
        toast.success("Video uploaded successfully!")
      } else {
        throw new Error("Failed to get video URL")
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setVideoUploadStatus({
        file,
        status: "error",
        progress: 0,
        resultUrl: null,
        error: error.message,
      })
      toast.error(error.message || "Video upload failed")
    }
  }

  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setThumbnailUploadStatus({
      file,
      status: "uploading",
      progress: 20,
      resultUrl: null,
      error: null,
    })

    toast.info(`Uploading thumbnail: ${file.name}...`)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setThumbnailUploadStatus((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90),
      }))
    }, 300)

    try {
      const resultUrl = await uploadThumbnailFile(file)
      clearInterval(progressInterval)

      if (resultUrl) {
        setThumbnailUploadStatus({
          file,
          status: "success",
          progress: 100,
          resultUrl,
          error: null,
        })
        setThumbnailUrl(resultUrl) // Store the URL for form submission
        toast.success("Thumbnail uploaded successfully!")
      } else {
        throw new Error("Failed to get thumbnail URL")
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setThumbnailUploadStatus({
        file,
        status: "error",
        progress: 0,
        resultUrl: null,
        error: error.message,
      })
      toast.error(error.message || "Thumbnail upload failed")
    }
  }

  const handleEpisodeVideoFileSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
    if (!file.name.match(allowedExtensions)) {
      toast.error("Invalid file type. Allowed: mp4, webm, mkv, avi, mov")
      return
    }
    if (file.size > 10 * 1024 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10GB")
      return
    }

    // Update episode with file and uploading status
    const updated = [...episodes]
    updated[index] = {
      ...updated[index],
      videoFile: file,
      videoUploadStatus: {
        file,
        status: "uploading",
        progress: 10,
        resultUrl: null,
        error: null,
      },
    }
    setEpisodes(updated)

    toast.info(`Uploading Episode ${updated[index].episodeNumber} video...`)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setEpisodes((prev) => {
        const newEpisodes = [...prev]
        if (newEpisodes[index]?.videoUploadStatus) {
          newEpisodes[index] = {
            ...newEpisodes[index],
            videoUploadStatus: {
              ...newEpisodes[index].videoUploadStatus!,
              progress: Math.min((newEpisodes[index].videoUploadStatus?.progress || 0) + 5, 90),
            },
          }
        }
        return newEpisodes
      })
    }, 500)

    try {
      const ep = updated[index]
      const resultUrl = await uploadVideoFile(file, `${title || "Series"} - S${ep.seasonNumber}E${ep.episodeNumber}`)
      clearInterval(progressInterval)

      if (resultUrl) {
        setEpisodes((prev) => {
          const newEpisodes = [...prev]
          newEpisodes[index] = {
            ...newEpisodes[index],
            videoUrl: resultUrl,
            videoUploadStatus: {
              file,
              status: "success",
              progress: 100,
              resultUrl,
              error: null,
            },
          }
          return newEpisodes
        })
        toast.success(`Episode ${ep.episodeNumber} video uploaded!`)
      } else {
        throw new Error("Failed to get video URL")
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setEpisodes((prev) => {
        const newEpisodes = [...prev]
        newEpisodes[index] = {
          ...newEpisodes[index],
          videoUploadStatus: {
            file,
            status: "error",
            progress: 0,
            resultUrl: null,
            error: error.message,
          },
        }
        return newEpisodes
      })
      toast.error(`Episode ${updated[index].episodeNumber} upload failed: ${error.message}`)
    }
  }

  const clearVideoUpload = () => {
    setSelectedVideoFile(null)
    setVideoUrl("")
    setVideoUploadStatus({
      file: null,
      status: "idle",
      progress: 0,
      resultUrl: null,
      error: null,
    })
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const clearThumbnailUpload = () => {
    setSelectedThumbnailFile(null)
    setThumbnailUrl("")
    setThumbnailPreview("")
    setThumbnailUploadStatus({
      file: null,
      status: "idle",
      progress: 0,
      resultUrl: null,
      error: null,
    })
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  const clearEpisodeVideoUpload = (index: number) => {
    setEpisodes((prev) => {
      const newEpisodes = [...prev]
      newEpisodes[index] = {
        ...newEpisodes[index],
        videoFile: null,
        videoUrl: "",
        videoUploadStatus: {
          file: null,
          status: "idle",
          progress: 0,
          resultUrl: null,
          error: null,
        },
      }
      return newEpisodes
    })
    if (episodeVideoRefs.current[index]) episodeVideoRefs.current[index]!.value = ""
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
        videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
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
    setVideoUploadStatus({ file: null, status: "idle", progress: 0, resultUrl: null, error: null })
    setThumbnailUploadStatus({ file: null, status: "idle", progress: 0, resultUrl: null, error: null })
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
        videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
      },
    ])
    setExistingEpisodes([])
    if (videoInputRef.current) videoInputRef.current.value = ""
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  const areUploadsComplete = () => {
    if (uploadMode === "url") return true

    // Check thumbnail
    if (!thumbnailUrl && thumbnailUploadStatus.status !== "success") {
      return false
    }

    // For movies, check video
    if (contentType === "movie") {
      if (!videoUrl && videoUploadStatus.status !== "success") {
        return false
      }
    }

    // For series, check all episode videos
    if (contentType === "series") {
      for (const ep of episodes) {
        if (!ep.videoUrl && ep.videoUploadStatus?.status !== "success") {
          return false
        }
      }
    }

    return true
  }

  const isAnyUploadInProgress = () => {
    if (videoUploadStatus.status === "uploading") return true
    if (thumbnailUploadStatus.status === "uploading") return true
    return episodes.some((ep) => ep.videoUploadStatus?.status === "uploading")
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

    const finalVideoUrl = videoUrl || videoUploadStatus.resultUrl || ""
    const finalThumbnailUrl = thumbnailUrl || thumbnailUploadStatus.resultUrl || ""

    // Check thumbnail requirement
    if (!finalThumbnailUrl) {
      toast.error("Please upload a thumbnail first")
      return
    }

    // Check video requirement for movies
    if (contentType === "movie" && !finalVideoUrl) {
      toast.error("Please upload a video first")
      return
    }

    // Check episodes for series
    if (contentType === "series") {
      const missingEpisodes = episodes.filter((ep) => !ep.videoUrl && !ep.videoUploadStatus?.resultUrl)
      if (missingEpisodes.length > 0) {
        toast.error(`Please upload video for all episodes. Missing: Episode ${missingEpisodes[0].episodeNumber}`)
        return
      }
    }

    setLoading(true)

    try {
      // Build final episodes with uploaded URLs
      const finalEpisodes = episodes.map((ep) => ({
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title || `Episode ${ep.episodeNumber}`,
        description: ep.description,
        videoUrl: ep.videoUrl || ep.videoUploadStatus?.resultUrl || "",
        thumbnailUrl: ep.thumbnailUrl,
        duration: ep.duration,
      }))

      // Submit content
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
        episodes: contentType === "series" ? finalEpisodes : undefined,
      })

      if (result.success) {
        toast.success(result.autoApproved ? "Content published successfully!" : "Content submitted for review!")
        resetForm()
        onUploadComplete()
      } else {
        throw new Error(result.error || "Failed to submit content")
      }
    } catch (error: any) {
      toast.error(error.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  const handleAddEpisodes = async () => {
    const validEpisodes = episodes.filter((ep) => ep.videoUrl || ep.videoUploadStatus?.resultUrl)
    if (validEpisodes.length === 0) {
      toast.error("Please add at least one episode with a video")
      return
    }

    setLoading(true)

    try {
      const result = await addEpisodesToSubmission({
        submissionId: editingSubmission.id,
        episodes: validEpisodes.map((ep) => ({
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title || `Episode ${ep.episodeNumber}`,
          description: ep.description,
          videoUrl: ep.videoUrl || ep.videoUploadStatus?.resultUrl || "",
          thumbnailUrl: ep.thumbnailUrl,
          duration: ep.duration,
        })),
      })

      if (result.success) {
        toast.success("Episodes added successfully!")
        onCancelEdit?.()
        onUploadComplete()
      } else {
        throw new Error(result.error || "Failed to add episodes")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add episodes")
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const renderUploadStatus = (status: FileUploadStatus, onClear: () => void) => {
    if (status.status === "idle") return null

    return (
      <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.status === "uploading" && (
              <>
                <Loader className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Uploading... {status.progress}%</span>
              </>
            )}
            {status.status === "success" && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Upload complete!</span>
              </>
            )}
            {status.status === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{status.error || "Upload failed"}</span>
              </>
            )}
          </div>
          {(status.status === "success" || status.status === "error") && (
            <button type="button" onClick={onClear} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {status.status === "uploading" && (
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${status.progress}%` }} />
          </div>
        )}
        {status.status === "success" && status.resultUrl && (
          <div className="mt-1 truncate text-xs text-muted-foreground">{status.resultUrl}</div>
        )}
      </div>
    )
  }

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

        {/* Thumbnail Section */}
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
                  disabled={thumbnailUploadStatus.status === "uploading"}
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={thumbnailUploadStatus.status === "uploading"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
                >
                  {thumbnailUploadStatus.status === "uploading" ? (
                    <div className="flex items-center gap-2">
                      <Loader className="h-5 w-5 animate-spin text-primary" />
                      <span>Uploading thumbnail...</span>
                    </div>
                  ) : thumbnailUploadStatus.status === "success" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Thumbnail uploaded!</span>
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
                {renderUploadStatus(thumbnailUploadStatus, clearThumbnailUpload)}
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
                  disabled={videoUploadStatus.status === "uploading"}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploadStatus.status === "uploading"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
                >
                  {videoUploadStatus.status === "uploading" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="h-8 w-8 animate-spin text-primary" />
                      <span>Uploading video... {videoUploadStatus.progress}%</span>
                      <span className="text-sm text-muted-foreground">Please wait, this may take a while</span>
                    </div>
                  ) : videoUploadStatus.status === "success" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Video uploaded successfully!</span>
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
                {renderUploadStatus(videoUploadStatus, clearVideoUpload)}
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

            {/* Existing Episodes */}
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
                          disabled={episode.videoUploadStatus?.status === "uploading"}
                        />
                        <button
                          type="button"
                          onClick={() => episodeVideoRefs.current[index]?.click()}
                          disabled={episode.videoUploadStatus?.status === "uploading"}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
                        >
                          {episode.videoUploadStatus?.status === "uploading" ? (
                            <div className="flex items-center gap-2">
                              <Loader className="h-4 w-4 animate-spin text-primary" />
                              <span>Uploading... {episode.videoUploadStatus.progress}%</span>
                            </div>
                          ) : episode.videoUploadStatus?.status === "success" ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-500">Video uploaded!</span>
                            </div>
                          ) : episode.videoUrl ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>URL provided</span>
                            </div>
                          ) : (
                            <>
                              <FileVideo className="h-5 w-5 text-muted-foreground" />
                              <span className="text-muted-foreground">Click to upload video</span>
                            </>
                          )}
                        </button>
                        {episode.videoUploadStatus &&
                          renderUploadStatus(episode.videoUploadStatus, () => clearEpisodeVideoUpload(index))}
                        {!episode.videoFile && !episode.videoUploadStatus?.resultUrl && (
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
          disabled={loading || !canUpload || isAnyUploadInProgress()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            editingSubmission
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
              : contentType === "movie"
                ? "bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50"
          }`}
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : isAnyUploadInProgress() ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Waiting for uploads...
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
      </form>
    </div>
  )
}
