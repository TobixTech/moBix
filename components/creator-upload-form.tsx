"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, Plus, Film, Tv, Check, X, LinkIcon, FileVideo, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { submitContent, addEpisodesToSubmission, getSubmissionEpisodes } from "@/lib/creator-actions"

interface Episode {
  episodeNumber: number
  seasonNumber: number
  title: string
  videoUrl: string
  duration: string
  videoFile?: File | null
  uploadStatus?: "idle" | "uploading" | "success" | "error"
  uploadProgress?: number
  uploadError?: string
}

interface UploadStatus {
  status: "idle" | "uploading" | "processing" | "success" | "error"
  progress: number
  resultUrl: string | null
  error: string | null
}

interface CreatorUploadFormProps {
  creatorId: number
  dailyUploadsRemaining: number
  dailyStorageRemaining: number
  onSubmitSuccess?: () => void
  editingSubmission?: {
    id: number
    type: string
    title: string
    description: string
    genre: string
    seasonNumber?: number
    totalEpisodes?: number
  } | null
  onCancelEdit?: () => void
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
  creatorId,
  dailyUploadsRemaining,
  dailyStorageRemaining,
  onSubmitSuccess,
  editingSubmission,
  onCancelEdit,
}: CreatorUploadFormProps) {
  const [contentType, setContentType] = useState<"movie" | "series">(
    editingSubmission?.type === "series" ? "series" : "movie",
  )
  const [uploadMode, setUploadMode] = useState<"url" | "file">("file")
  const [title, setTitle] = useState(editingSubmission?.title || "")
  const [description, setDescription] = useState(editingSubmission?.description || "")
  const [genre, setGenre] = useState(editingSubmission?.genre || "")
  const [year, setYear] = useState(new Date().getFullYear().toString())

  // Movie fields
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [duration, setDuration] = useState("")

  // File upload states
  const [videoUpload, setVideoUpload] = useState<UploadStatus>({
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })
  const [thumbnailUpload, setThumbnailUpload] = useState<UploadStatus>({
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })

  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Series fields
  const [seasonNumber, setSeasonNumber] = useState(editingSubmission?.seasonNumber?.toString() || "1")
  const [episodes, setEpisodes] = useState<Episode[]>([
    { episodeNumber: 1, seasonNumber: 1, title: "", videoUrl: "", duration: "", uploadStatus: "idle" },
  ])
  const [existingEpisodes, setExistingEpisodes] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing episodes if editing
  useEffect(() => {
    if (editingSubmission?.id) {
      loadExistingEpisodes()
    }
  }, [editingSubmission])

  const loadExistingEpisodes = async () => {
    if (!editingSubmission?.id) return
    const result = await getSubmissionEpisodes(editingSubmission.id)
    if (result.success && result.episodes) {
      setExistingEpisodes(result.episodes)
      const maxEpisode = Math.max(...result.episodes.map((e: any) => e.episodeNumber), 0)
      setEpisodes([
        {
          episodeNumber: maxEpisode + 1,
          seasonNumber: editingSubmission.seasonNumber || 1,
          title: "",
          videoUrl: "",
          duration: "",
          uploadStatus: "idle",
        },
      ])
    }
  }

  // Upload file to server
  const uploadFile = async (
    file: File,
    type: "video" | "thumbnail",
    setStatus: React.Dispatch<React.SetStateAction<UploadStatus>>,
  ): Promise<string | null> => {
    setStatus({ status: "uploading", progress: 10, resultUrl: null, error: null })

    try {
      const formData = new FormData()
      formData.append(type, file) // "video" or "thumbnail"
      formData.append("title", title || file.name)

      const endpoint = type === "video" ? "/api/upload/video" : "/api/upload/thumbnail"

      setStatus((prev) => ({ ...prev, progress: 30 }))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minute timeout

      let response: Response
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === "AbortError") {
          throw new Error("Upload timed out. Please try a smaller file or check your connection.")
        }
        throw new Error(`Network error: ${fetchError.message}`)
      }
      clearTimeout(timeoutId)

      setStatus((prev) => ({ ...prev, progress: 70, status: "processing" }))

      const contentType = response.headers.get("content-type")
      let result: any

      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const textResponse = await response.text()
        console.error(`[v0] Non-JSON response from ${endpoint}:`, textResponse)

        if (
          textResponse.toLowerCase().includes("entity too large") ||
          textResponse.toLowerCase().includes("too large")
        ) {
          throw new Error("File is too large. Please try a smaller file (max 500MB recommended).")
        } else if (textResponse.toLowerCase().includes("timeout")) {
          throw new Error("Upload timed out. Please try again with a smaller file.")
        } else {
          throw new Error(textResponse || "Upload failed - server returned an invalid response")
        }
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed")
      }

      const finalUrl = type === "video" ? result.embedUrl : result.thumbnailUrl || result.cdnUrl
      setStatus({ status: "success", progress: 100, resultUrl: finalUrl, error: null })
      return finalUrl
    } catch (error: any) {
      console.error(`[v0] ${type} upload error:`, error)
      setStatus({ status: "error", progress: 0, resultUrl: null, error: error.message })
      toast.error(`Upload failed: ${error.message}`)
      return null
    }
  }

  // Handle video file selection
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file")
      return
    }

    // Validate file size (max 5GB)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error("Video file must be less than 5GB")
      return
    }

    const url = await uploadFile(file, "video", setVideoUpload)
    if (url) {
      setVideoUrl(url)
      toast.success("Video uploaded successfully!")
    }
  }

  // Handle thumbnail file selection
  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Thumbnail must be less than 15MB")
      return
    }

    const url = await uploadFile(file, "thumbnail", setThumbnailUpload)
    if (url) {
      setThumbnailUrl(url)
      toast.success("Thumbnail uploaded successfully!")
    }
  }

  // Handle episode video upload
  const handleEpisodeVideoSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size - recommend max 500MB for episodes
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Episode videos should be under 500MB for reliable uploads")
    }

    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, uploadStatus: "uploading", uploadProgress: 10 } : ep)),
    )

    try {
      const formData = new FormData()
      formData.append("video", file)
      formData.append("title", episodes[index].title || `Episode ${episodes[index].episodeNumber}`)

      setEpisodes((prev) => prev.map((ep, i) => (i === index ? { ...ep, uploadProgress: 30 } : ep)))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minute timeout

      let response: Response
      try {
        response = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === "AbortError") {
          throw new Error("Upload timed out. Please try a smaller file.")
        }
        throw new Error(`Network error: ${fetchError.message}`)
      }
      clearTimeout(timeoutId)

      setEpisodes((prev) => prev.map((ep, i) => (i === index ? { ...ep, uploadProgress: 70 } : ep)))

      const contentType = response.headers.get("content-type")
      let result: any

      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const textResponse = await response.text()
        console.error("[v0] Non-JSON response:", textResponse)
        if (textResponse.toLowerCase().includes("too large")) {
          throw new Error("File is too large. Please try a smaller file.")
        }
        throw new Error(textResponse || "Upload failed")
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed")
      }

      setEpisodes((prev) =>
        prev.map((ep, i) =>
          i === index ? { ...ep, videoUrl: result.embedUrl, uploadStatus: "success", uploadProgress: 100 } : ep,
        ),
      )
      toast.success(`Episode ${episodes[index].episodeNumber} video uploaded!`)
    } catch (error: any) {
      console.error("[v0] Episode upload error:", error)
      setEpisodes((prev) =>
        prev.map((ep, i) => (i === index ? { ...ep, uploadStatus: "error", uploadError: error.message } : ep)),
      )
      toast.error(`Upload failed: ${error.message}`)
    }
  }

  const addEpisode = () => {
    const lastEp = episodes[episodes.length - 1]
    setEpisodes([
      ...episodes,
      {
        episodeNumber: lastEp.episodeNumber + 1,
        seasonNumber: Number(seasonNumber),
        title: "",
        videoUrl: "",
        duration: "",
        uploadStatus: "idle",
      },
    ])
  }

  const removeEpisode = (index: number) => {
    if (episodes.length > 1) {
      setEpisodes(episodes.filter((_, i) => i !== index))
    }
  }

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    setEpisodes(episodes.map((ep, i) => (i === index ? { ...ep, [field]: value } : ep)))
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (title.length < 3) {
      toast.error("Title must be at least 3 characters")
      return
    }
    if (!description.trim() || description.length < 20) {
      toast.error("Description must be at least 20 characters")
      return
    }
    if (!genre) {
      toast.error("Please select a genre")
      return
    }

    // Check upload states
    if (videoUpload.status === "uploading" || thumbnailUpload.status === "uploading") {
      toast.error("Please wait for uploads to complete")
      return
    }

    const finalVideoUrl = videoUpload.resultUrl || videoUrl
    const finalThumbnailUrl = thumbnailUpload.resultUrl || thumbnailUrl

    if (contentType === "movie") {
      if (!finalVideoUrl) {
        toast.error("Please provide a video URL or upload a video file")
        return
      }
      if (!finalThumbnailUrl) {
        toast.error("Please provide a thumbnail URL or upload a thumbnail")
        return
      }
    } else {
      // Series validation
      const hasAnyEpisodeUploading = episodes.some((ep) => ep.uploadStatus === "uploading")
      if (hasAnyEpisodeUploading) {
        toast.error("Please wait for episode uploads to complete")
        return
      }

      const validEpisodes = episodes.filter((ep) => ep.videoUrl && ep.title)
      if (validEpisodes.length === 0) {
        toast.error("Please add at least one episode with title and video")
        return
      }
      if (!finalThumbnailUrl) {
        toast.error("Please provide a thumbnail URL or upload a thumbnail")
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (editingSubmission?.id && contentType === "series") {
        // Adding episodes to existing submission
        const newEpisodes = episodes
          .filter((ep) => ep.videoUrl && ep.title)
          .map((ep) => ({
            episodeNumber: ep.episodeNumber,
            seasonNumber: Number(seasonNumber),
            title: ep.title,
            videoUrl: ep.videoUrl,
            duration: ep.duration || "0",
          }))

        const result = await addEpisodesToSubmission(editingSubmission.id, newEpisodes)

        if (result.success) {
          toast.success("Episodes added successfully!")
          onCancelEdit?.()
          onSubmitSuccess?.()
        } else {
          toast.error(result.error || "Failed to add episodes")
        }
      } else {
        // New submission
        const submissionData = {
          type: contentType,
          title,
          description,
          genre,
          year: Number(year),
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          duration: duration || undefined,
          seasonNumber: contentType === "series" ? Number(seasonNumber) : undefined,
          episodes:
            contentType === "series"
              ? episodes
                  .filter((ep) => ep.videoUrl && ep.title)
                  .map((ep) => ({
                    episodeNumber: ep.episodeNumber,
                    seasonNumber: Number(seasonNumber),
                    title: ep.title,
                    videoUrl: ep.videoUrl,
                    duration: ep.duration || "0",
                  }))
              : undefined,
        }

        const result = await submitContent(submissionData)

        if (result.success) {
          toast.success("Content submitted for review!")
          // Reset form
          setTitle("")
          setDescription("")
          setGenre("")
          setVideoUrl("")
          setThumbnailUrl("")
          setDuration("")
          setVideoUpload({ status: "idle", progress: 0, resultUrl: null, error: null })
          setThumbnailUpload({ status: "idle", progress: 0, resultUrl: null, error: null })
          setEpisodes([
            { episodeNumber: 1, seasonNumber: 1, title: "", videoUrl: "", duration: "", uploadStatus: "idle" },
          ])
          onSubmitSuccess?.()
        } else {
          toast.error(result.error || "Failed to submit content")
        }
      }
    } catch (error: any) {
      console.error("[v0] Submit error:", error)
      toast.error("Failed to submit content")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderUploadStatus = (upload: UploadStatus, type: "video" | "thumbnail") => {
    if (upload.status === "idle") return null

    return (
      <div className="mt-2">
        {(upload.status === "uploading" || upload.status === "processing") && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#00FFFF]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{upload.status === "processing" ? "Processing..." : "Uploading..."}</span>
              <span>{upload.progress}%</span>
            </div>
            <Progress value={upload.progress} className="h-2" />
          </div>
        )}
        {upload.status === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            <span>{type === "video" ? "Video" : "Thumbnail"} uploaded successfully</span>
          </div>
        )}
        {upload.status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <X className="w-4 h-4" />
            <span>{upload.error || "Upload failed"}</span>
          </div>
        )}
      </div>
    )
  }

  // Check if any upload is in progress
  const isUploading =
    videoUpload.status === "uploading" ||
    videoUpload.status === "processing" ||
    thumbnailUpload.status === "uploading" ||
    thumbnailUpload.status === "processing" ||
    episodes.some((ep) => ep.uploadStatus === "uploading")

  return (
    <Card className="bg-[#1A1B23] border-[#2A2B33]">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>{editingSubmission ? `Add Episodes to "${editingSubmission.title}"` : "Upload Content"}</span>
          {editingSubmission && (
            <Button variant="ghost" size="sm" onClick={onCancelEdit} className="text-white/60 hover:text-white">
              Cancel Edit
            </Button>
          )}
        </CardTitle>
        {!editingSubmission && (
          <div className="flex gap-2 text-sm text-white/60">
            <span>Uploads today: {4 - dailyUploadsRemaining}/4</span>
            <span>|</span>
            <span>Storage used: {(8 - dailyStorageRemaining).toFixed(1)}/8 GB</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!editingSubmission && (
          <>
            {/* Content Type Selection */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={contentType === "movie" ? "default" : "outline"}
                className={contentType === "movie" ? "bg-[#00FFFF] text-black" : "border-[#2A2B33] text-white"}
                onClick={() => setContentType("movie")}
              >
                <Film className="w-4 h-4 mr-2" />
                Movie
              </Button>
              <Button
                type="button"
                variant={contentType === "series" ? "default" : "outline"}
                className={contentType === "series" ? "bg-[#00FFFF] text-black" : "border-[#2A2B33] text-white"}
                onClick={() => setContentType("series")}
              >
                <Tv className="w-4 h-4 mr-2" />
                Series
              </Button>
            </div>

            {/* Upload Mode Selection */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={uploadMode === "file" ? "default" : "outline"}
                className={uploadMode === "file" ? "bg-purple-600 text-white" : "border-[#2A2B33] text-white"}
                onClick={() => setUploadMode("file")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <Button
                type="button"
                variant={uploadMode === "url" ? "default" : "outline"}
                className={uploadMode === "url" ? "bg-purple-600 text-white" : "border-[#2A2B33] text-white"}
                onClick={() => setUploadMode("url")}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Paste URLs
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white">Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className="bg-[#0B0C10] border-[#2A2B33] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Genre *</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-[#0B0C10] border-[#2A2B33] text-white">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1B23] border-[#2A2B33]">
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g} className="text-white hover:bg-[#2A2B33]">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (minimum 20 characters)"
                className="bg-[#0B0C10] border-[#2A2B33] text-white min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white">Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Release year"
                  className="bg-[#0B0C10] border-[#2A2B33] text-white"
                />
              </div>
              {contentType === "movie" && (
                <div className="space-y-2">
                  <Label className="text-white">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 120"
                    className="bg-[#0B0C10] border-[#2A2B33] text-white"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Thumbnail Upload */}
        <div className="space-y-2">
          <Label className="text-white">Thumbnail *</Label>
          {uploadMode === "file" || editingSubmission ? (
            <div className="space-y-2">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  thumbnailUpload.status === "success"
                    ? "border-green-500 bg-green-500/10"
                    : thumbnailUpload.status === "error"
                      ? "border-red-500 bg-red-500/10"
                      : "border-[#2A2B33] hover:border-[#00FFFF]/50"
                }`}
                onClick={() => thumbnailInputRef.current?.click()}
              >
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileSelect}
                  className="hidden"
                />
                {thumbnailUpload.status === "success" ? (
                  <div className="flex flex-col items-center gap-2">
                    <Check className="w-8 h-8 text-green-400" />
                    <span className="text-green-400">Thumbnail uploaded!</span>
                    <span className="text-xs text-white/40">Click to replace</span>
                  </div>
                ) : thumbnailUpload.status === "uploading" || thumbnailUpload.status === "processing" ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
                    <span className="text-[#00FFFF]">
                      {thumbnailUpload.status === "processing" ? "Processing..." : "Uploading..."}
                    </span>
                    <Progress value={thumbnailUpload.progress} className="w-full max-w-xs h-2" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-white/40" />
                    <span className="text-white/60">Click to upload thumbnail</span>
                    <span className="text-xs text-white/40">JPG, PNG, WebP (max 15MB)</span>
                  </div>
                )}
              </div>
              {thumbnailUpload.status === "error" && <p className="text-sm text-red-400">{thumbnailUpload.error}</p>}
            </div>
          ) : (
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              className="bg-[#0B0C10] border-[#2A2B33] text-white"
            />
          )}
        </div>

        {/* Movie Video Upload */}
        {contentType === "movie" && !editingSubmission && (
          <div className="space-y-2">
            <Label className="text-white">Video *</Label>
            {uploadMode === "file" ? (
              <div className="space-y-2">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    videoUpload.status === "success"
                      ? "border-green-500 bg-green-500/10"
                      : videoUpload.status === "error"
                        ? "border-red-500 bg-red-500/10"
                        : "border-[#2A2B33] hover:border-[#00FFFF]/50"
                  }`}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileSelect}
                    className="hidden"
                  />
                  {videoUpload.status === "success" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Check className="w-8 h-8 text-green-400" />
                      <span className="text-green-400">Video uploaded!</span>
                      <span className="text-xs text-white/40">Click to replace</span>
                    </div>
                  ) : videoUpload.status === "uploading" || videoUpload.status === "processing" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#00FFFF] animate-spin" />
                      <span className="text-[#00FFFF]">
                        {videoUpload.status === "processing" ? "Processing video..." : "Uploading..."}
                      </span>
                      <Progress value={videoUpload.progress} className="w-full max-w-xs h-2" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileVideo className="w-8 h-8 text-white/40" />
                      <span className="text-white/60">Click to upload video</span>
                      <span className="text-xs text-white/40">MP4, WebM, MKV (max 5GB)</span>
                    </div>
                  )}
                </div>
                {videoUpload.status === "error" && <p className="text-sm text-red-400">{videoUpload.error}</p>}
              </div>
            ) : (
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://voe.sx/e/xxxxx or embed URL"
                className="bg-[#0B0C10] border-[#2A2B33] text-white"
              />
            )}
          </div>
        )}

        {/* Series Episodes */}
        {(contentType === "series" || editingSubmission?.type === "series") && (
          <div className="space-y-4">
            {!editingSubmission && (
              <div className="space-y-2">
                <Label className="text-white">Season Number</Label>
                <Input
                  type="number"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(e.target.value)}
                  min="1"
                  className="bg-[#0B0C10] border-[#2A2B33] text-white w-32"
                />
              </div>
            )}

            {/* Existing Episodes (Read-only) */}
            {existingEpisodes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white/60">Existing Episodes</Label>
                <div className="space-y-2 opacity-60">
                  {existingEpisodes.map((ep) => (
                    <div key={ep.id} className="flex items-center gap-2 p-2 bg-[#0B0C10] rounded-lg">
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        S{ep.seasonNumber}E{ep.episodeNumber}
                      </Badge>
                      <span className="text-white/60 text-sm">{ep.title}</span>
                      <Check className="w-4 h-4 text-green-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Episodes */}
            <div className="space-y-2">
              <Label className="text-white">{editingSubmission ? "New Episodes" : "Episodes"}</Label>
              <div className="space-y-4">
                {episodes.map((episode, index) => (
                  <div key={index} className="p-4 bg-[#0B0C10] rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#00FFFF]/20 text-[#00FFFF]">
                        S{seasonNumber}E{episode.episodeNumber}
                      </Badge>
                      {episodes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEpisode(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={episode.title}
                        onChange={(e) => updateEpisode(index, "title", e.target.value)}
                        placeholder="Episode title"
                        className="bg-[#1A1B23] border-[#2A2B33] text-white"
                      />
                      <Input
                        value={episode.duration}
                        onChange={(e) => updateEpisode(index, "duration", e.target.value)}
                        placeholder="Duration (minutes)"
                        type="number"
                        className="bg-[#1A1B23] border-[#2A2B33] text-white"
                      />
                    </div>

                    {/* Episode Video Upload */}
                    {uploadMode === "file" || editingSubmission ? (
                      <div className="space-y-2">
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                            episode.uploadStatus === "success"
                              ? "border-green-500 bg-green-500/10"
                              : episode.uploadStatus === "error"
                                ? "border-red-500 bg-red-500/10"
                                : "border-[#2A2B33] hover:border-[#00FFFF]/50"
                          }`}
                          onClick={() => {
                            const input = document.getElementById(`episode-video-${index}`) as HTMLInputElement
                            input?.click()
                          }}
                        >
                          <input
                            id={`episode-video-${index}`}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleEpisodeVideoSelect(index, e)
                            }}
                            className="hidden"
                          />
                          {episode.uploadStatus === "success" ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 text-sm">Video uploaded</span>
                            </div>
                          ) : episode.uploadStatus === "uploading" ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-5 h-5 text-[#00FFFF] animate-spin" />
                              <Progress value={episode.uploadProgress || 0} className="w-full max-w-xs h-2" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <FileVideo className="w-5 h-5 text-white/40" />
                              <span className="text-white/60 text-sm">Click to upload episode video</span>
                            </div>
                          )}
                        </div>
                        {episode.uploadStatus === "error" && (
                          <p className="text-xs text-red-400">{episode.uploadError}</p>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={episode.videoUrl}
                        onChange={(e) => updateEpisode(index, "videoUrl", e.target.value)}
                        placeholder="Video URL (VOE embed URL)"
                        className="bg-[#1A1B23] border-[#2A2B33] text-white"
                      />
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addEpisode}
                  className="w-full border-dashed border-[#2A2B33] text-white/60 hover:text-white hover:border-[#00FFFF] bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Episode
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading || dailyUploadsRemaining <= 0}
          className="w-full bg-gradient-to-r from-[#00FFFF] to-cyan-400 text-black font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Waiting for uploads...
            </>
          ) : dailyUploadsRemaining <= 0 ? (
            "Daily upload limit reached"
          ) : editingSubmission ? (
            "Add Episodes"
          ) : (
            "Submit for Review"
          )}
        </Button>

        {dailyUploadsRemaining <= 0 && (
          <p className="text-center text-sm text-yellow-400">
            You have reached your daily upload limit. Try again tomorrow.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
