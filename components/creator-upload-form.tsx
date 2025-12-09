"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  Upload,
  Film,
  Tv,
  ImageIcon,
  Plus,
  Trash2,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  FileVideo,
  ImagePlusIcon as ImageLucide,
  LinkIcon,
} from "lucide-react"
import { submitContent } from "@/lib/creator-actions"
import { toast } from "sonner"

interface CreatorUploadFormProps {
  dailyTracking: {
    uploadsToday: number
    storageUsedToday: number
    uploadLimit: number
    storageLimit: number
  }
  onUploadComplete: () => void
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
}

interface UploadProgress {
  video: number
  thumbnail: number
  episodeUploads: { [key: number]: number }
  isUploading: boolean
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

export function CreatorUploadForm({ dailyTracking, onUploadComplete }: CreatorUploadFormProps) {
  const [contentType, setContentType] = useState<ContentType>("movie")
  const [uploadMode, setUploadMode] = useState<UploadMode>("url")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    video: 0,
    thumbnail: 0,
    episodeUploads: {},
    isUploading: false,
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
      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Video upload failed")
      }

      return result.embedUrl
    } catch (error: any) {
      toast.error(error.message || "Failed to upload video")
      return null
    }
  }

  const uploadThumbnailFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("thumbnail", file)

    try {
      const response = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Thumbnail upload failed")
      }

      return result.thumbnailUrl
    } catch (error: any) {
      toast.error(error.message || "Failed to upload thumbnail")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canUpload) {
      toast.error("Daily upload limit reached")
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

    setLoading(true)
    setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: true })

    let finalVideoUrl = videoUrl
    let finalThumbnailUrl = thumbnailUrl

    try {
      // Upload thumbnail if in file mode
      if (uploadMode === "file" && selectedThumbnailFile) {
        toast.info("Uploading thumbnail...")
        setUploadProgress((prev) => ({ ...prev, thumbnail: 50 }))
        const uploadedThumbnailUrl = await uploadThumbnailFile(selectedThumbnailFile)
        if (!uploadedThumbnailUrl) {
          throw new Error("Thumbnail upload failed")
        }
        finalThumbnailUrl = uploadedThumbnailUrl
        setUploadProgress((prev) => ({ ...prev, thumbnail: 100 }))
      }

      // For movies, upload video file
      if (contentType === "movie" && uploadMode === "file" && selectedVideoFile) {
        toast.info("Uploading video to VOE...")
        setUploadProgress((prev) => ({ ...prev, video: 50 }))
        const uploadedVideoUrl = await uploadVideoFile(selectedVideoFile)
        if (!uploadedVideoUrl) {
          throw new Error("Video upload failed")
        }
        finalVideoUrl = uploadedVideoUrl
        setUploadProgress((prev) => ({ ...prev, video: 100 }))
      }

      const finalEpisodes = [...episodes]
      if (contentType === "series" && uploadMode === "file") {
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i]
          if (ep.videoFile) {
            toast.info(`Uploading Episode ${i + 1} video...`)
            setUploadProgress((prev) => ({
              ...prev,
              currentEpisode: i,
              episodeUploads: { ...prev.episodeUploads, [i]: 50 },
            }))
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
          }
        }
      }

      // Validate required fields
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
                title: ep.title,
                description: ep.description,
                videoUrl: ep.videoUrl,
                thumbnailUrl: ep.thumbnailUrl,
                duration: ep.duration,
              }))
            : undefined,
      })

      if (result.success) {
        toast.success(result.autoApproved ? "Content published successfully!" : "Content submitted for review!")
        // Reset form
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
        onUploadComplete()
      } else {
        throw new Error(result.error || "Failed to submit content")
      }
    } catch (error: any) {
      toast.error(error.message || "Submission failed")
    } finally {
      setLoading(false)
      setUploadProgress({ video: 0, thumbnail: 0, episodeUploads: {}, isUploading: false })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  return (
    <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-xl p-4 md:p-6">
      <h2 className="text-xl font-bold text-white mb-6">Upload Content</h2>

      {/* Daily Limits Display */}
      <div className="mb-6 p-4 bg-[#0B0C10] border border-[#2A2B33] rounded-xl">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-white/60">Uploads today: </span>
            <span
              className={`font-bold ${dailyTracking.uploadsToday >= dailyTracking.uploadLimit ? "text-red-400" : "text-[#00FFFF]"}`}
            >
              {dailyTracking.uploadsToday}/{dailyTracking.uploadLimit}
            </span>
          </div>
          <div>
            <span className="text-white/60">Storage used: </span>
            <span
              className={`font-bold ${dailyTracking.storageUsedToday >= dailyTracking.storageLimit ? "text-red-400" : "text-[#00FFFF]"}`}
            >
              {dailyTracking.storageUsedToday.toFixed(1)}/{dailyTracking.storageLimit} GB
            </span>
          </div>
        </div>
      </div>

      {/* Content Type Selector */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setContentType("movie")}
          className={`flex-1 p-4 rounded-xl border-2 transition ${
            contentType === "movie" ? "border-[#00FFFF] bg-[#00FFFF]/10" : "border-[#2A2B33] hover:border-[#3A3B43]"
          }`}
        >
          <Film className={`w-8 h-8 mx-auto mb-2 ${contentType === "movie" ? "text-[#00FFFF]" : "text-white/60"}`} />
          <p className={`font-bold ${contentType === "movie" ? "text-[#00FFFF]" : "text-white"}`}>Movie</p>
          <p className="text-white/50 text-sm">Single video file</p>
        </button>
        <button
          type="button"
          onClick={() => setContentType("series")}
          className={`flex-1 p-4 rounded-xl border-2 transition ${
            contentType === "series" ? "border-purple-500 bg-purple-500/10" : "border-[#2A2B33] hover:border-[#3A3B43]"
          }`}
        >
          <Tv className={`w-8 h-8 mx-auto mb-2 ${contentType === "series" ? "text-purple-400" : "text-white/60"}`} />
          <p className={`font-bold ${contentType === "series" ? "text-purple-400" : "text-white"}`}>Series</p>
          <p className="text-white/50 text-sm">Multiple episodes</p>
        </button>
      </div>

      {/* Upload Mode Toggle */}
      <div className="mb-6 p-1 bg-[#0B0C10] rounded-lg inline-flex">
        <button
          type="button"
          onClick={() => setUploadMode("file")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
            uploadMode === "file" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white/60 hover:text-white"
          }`}
        >
          <FileVideo className="w-4 h-4" />
          Upload Files
        </button>
        <button
          type="button"
          onClick={() => setUploadMode("url")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
            uploadMode === "url" ? "bg-[#00FFFF] text-[#0B0C10]" : "text-white/60 hover:text-white"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Paste URLs
        </button>
      </div>

      {!canUpload && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-200 text-sm">
            You've reached your daily upload limit ({dailyTracking.uploadLimit} uploads). Try again tomorrow.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-white/70 text-sm mb-2">Title * (min 3 characters)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
              minLength={3}
              className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white/70 text-sm mb-2">Description * (min 20 characters)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              required
              minLength={20}
              rows={4}
              className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF] resize-none"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Genre *</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
            >
              <option value="">Select genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value))}
              min={1900}
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
            />
          </div>
        </div>

        {/* Thumbnail Upload/URL */}
        <div>
          <label className="block text-white/70 text-sm mb-2">
            Thumbnail * {uploadMode === "file" ? "(Upload Image)" : "(Publitio CDN URL)"}
          </label>
          {uploadMode === "file" ? (
            <div className="flex flex-col md:flex-row gap-4">
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
                className="flex-1 p-4 border-2 border-dashed border-[#2A2B33] rounded-lg hover:border-[#00FFFF] transition flex flex-col items-center justify-center gap-2"
              >
                {selectedThumbnailFile ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <span className="text-white text-sm">{selectedThumbnailFile.name}</span>
                    <span className="text-white/50 text-xs">{formatFileSize(selectedThumbnailFile.size)}</span>
                  </>
                ) : (
                  <>
                    <ImageLucide className="w-8 h-8 text-white/40" />
                    <span className="text-white/60 text-sm">Click to select thumbnail</span>
                    <span className="text-white/40 text-xs">JPG, PNG, WebP (max 15MB)</span>
                  </>
                )}
              </button>
              {thumbnailPreview && (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden">
                  <img
                    src={thumbnailPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedThumbnailFile(null)
                      setThumbnailPreview("")
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://media.publit.io/..."
                required={uploadMode === "url"}
                className="flex-1 px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
              />
              <div className="w-16 h-12 bg-[#0B0C10] border border-[#2A2B33] rounded-lg flex items-center justify-center overflow-hidden">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-white/30" />
                )}
              </div>
            </div>
          )}
          {uploadProgress.isUploading && uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
            <div className="mt-2">
              <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00FFFF] transition-all duration-300"
                  style={{ width: `${uploadProgress.thumbnail}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Banner URL (optional) */}
        <div>
          <label className="block text-white/70 text-sm mb-2">Banner URL (optional)</label>
          <input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://media.publit.io/..."
            className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
          />
        </div>

        {/* Movie Video Upload/URL */}
        {contentType === "movie" && (
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Video * {uploadMode === "file" ? "(Upload Video)" : "(VOE Embed URL)"}
            </label>
            {uploadMode === "file" ? (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/x-matroska,video/avi,video/quicktime,.mkv"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-[#2A2B33] rounded-lg hover:border-[#00FFFF] transition flex flex-col items-center justify-center gap-2"
                >
                  {selectedVideoFile ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-green-400" />
                      <span className="text-white font-medium">{selectedVideoFile.name}</span>
                      <span className="text-white/50 text-sm">{formatFileSize(selectedVideoFile.size)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVideoFile(null)
                        }}
                        className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <FileVideo className="w-10 h-10 text-white/40" />
                      <span className="text-white/60">Click to select video file</span>
                      <span className="text-white/40 text-sm">MP4, WebM, MKV, AVI, MOV (max 10GB)</span>
                    </>
                  )}
                </button>
                {uploadProgress.isUploading && uploadProgress.video > 0 && uploadProgress.video < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-white/60 mb-1">
                      <span>Uploading to VOE...</span>
                      <span>{uploadProgress.video}%</span>
                    </div>
                    <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FFFF] transition-all duration-300"
                        style={{ width: `${uploadProgress.video}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://voe.sx/e/..."
                required={uploadMode === "url"}
                className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
              />
            )}
          </div>
        )}

        {/* Series Options */}
        {contentType === "series" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Total Seasons</label>
                <input
                  type="number"
                  value={totalSeasons}
                  onChange={(e) => setTotalSeasons(Number.parseInt(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Status</label>
                <select
                  value={seriesStatus}
                  onChange={(e) => setSeriesStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF]"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Episodes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-white/70 text-sm">
                  Episodes * ({uploadMode === "file" ? "Upload videos or paste URLs" : "Paste VOE embed URLs"})
                </label>
                <button
                  type="button"
                  onClick={addEpisode}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Episode
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {episodes.map((episode, index) => (
                  <div key={index} className="p-4 bg-[#0B0C10] border border-[#2A2B33] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Episode {index + 1}</span>
                      {episodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEpisode(index)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="number"
                        value={episode.seasonNumber}
                        onChange={(e) => updateEpisode(index, "seasonNumber", Number.parseInt(e.target.value))}
                        placeholder="Season #"
                        min={1}
                        className="px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="number"
                        value={episode.episodeNumber}
                        onChange={(e) => updateEpisode(index, "episodeNumber", Number.parseInt(e.target.value))}
                        placeholder="Episode #"
                        min={1}
                        className="px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={episode.title}
                      onChange={(e) => updateEpisode(index, "title", e.target.value)}
                      placeholder="Episode title *"
                      required
                      className="w-full px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm mb-3 focus:outline-none focus:border-purple-500"
                    />

                    {uploadMode === "file" ? (
                      <div className="space-y-2">
                        <input
                          ref={(el) => {
                            episodeVideoRefs.current[index] = el
                          }}
                          type="file"
                          accept="video/mp4,video/webm,video/x-matroska,video/avi,video/quicktime,.mkv"
                          onChange={(e) => handleEpisodeVideoFileSelect(index, e)}
                          className="hidden"
                        />
                        {episode.videoFile ? (
                          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-white text-sm flex-1 truncate">{episode.videoFile.name}</span>
                            <button
                              type="button"
                              onClick={() => updateEpisode(index, "videoFile", null)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : episode.videoUrl ? (
                          <div className="flex items-center gap-2 p-2 bg-[#1A1B23] border border-[#2A2B33] rounded">
                            <LinkIcon className="w-4 h-4 text-[#00FFFF]" />
                            <span className="text-white/60 text-sm flex-1 truncate">{episode.videoUrl}</span>
                            <button
                              type="button"
                              onClick={() => updateEpisode(index, "videoUrl", "")}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => episodeVideoRefs.current[index]?.click()}
                              className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30 transition flex items-center justify-center gap-2"
                            >
                              <FileVideo className="w-4 h-4" />
                              Upload Video
                            </button>
                            <span className="text-white/40 flex items-center">or</span>
                            <input
                              type="url"
                              value={episode.videoUrl}
                              onChange={(e) => updateEpisode(index, "videoUrl", e.target.value)}
                              placeholder="Paste VOE URL"
                              className="flex-1 px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        )}
                        {uploadProgress.episodeUploads[index] > 0 && uploadProgress.episodeUploads[index] < 100 && (
                          <div className="h-1 bg-[#1A1B23] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${uploadProgress.episodeUploads[index]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={episode.videoUrl}
                        onChange={(e) => updateEpisode(index, "videoUrl", e.target.value)}
                        placeholder="Video URL (VOE embed) *"
                        required
                        className="w-full px-3 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !canUpload}
          className={`w-full px-6 py-3 font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 ${
            contentType === "movie"
              ? "bg-[#00FFFF] text-[#0B0C10] hover:shadow-lg hover:shadow-[#00FFFF]/50"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50"
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              {uploadProgress.isUploading ? "Uploading..." : "Submitting..."}
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit {contentType === "movie" ? "Movie" : "Series"}
            </>
          )}
        </button>

        {/* API Keys Notice */}
        {uploadMode === "file" && (
          <p className="text-white/40 text-xs text-center">
            Video uploads require VOE API key. Thumbnail uploads require Publitio API key.
            <br />
            Contact admin if uploads fail.
          </p>
        )}
      </form>
    </div>
  )
}
