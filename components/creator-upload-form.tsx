"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Plus, Film, Tv, Check, X, AlertCircle, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { submitContent, addEpisodesToSubmission, getSubmissionEpisodes } from "@/lib/creator-actions"
import { upload } from "@vercel/blob/client"

interface Episode {
  episodeNumber: number
  seasonNumber: number
  title: string
  videoUrl: string
  duration: string
  videoFile?: File | null
  videoUploadStatus?: UploadStatus
}

interface UploadStatus {
  file: File | null
  status: "idle" | "uploading" | "success" | "error"
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
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
  "K-Drama",
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
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [title, setTitle] = useState(editingSubmission?.title || "")
  const [description, setDescription] = useState(editingSubmission?.description || "")
  const [genre, setGenre] = useState(editingSubmission?.genre || "")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // File upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [videoUploadStatus, setVideoUploadStatus] = useState<UploadStatus>({
    file: null,
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState<UploadStatus>({
    file: null,
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
  })

  // Series states
  const [seasonNumber, setSeasonNumber] = useState(editingSubmission?.seasonNumber?.toString() || "1")
  const [totalEpisodes, setTotalEpisodes] = useState(editingSubmission?.totalEpisodes?.toString() || "")
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [existingEpisodes, setExistingEpisodes] = useState<Episode[]>([])

  // Load existing episodes when editing
  useEffect(() => {
    if (editingSubmission?.id) {
      loadExistingEpisodes()
    }
  }, [editingSubmission?.id])

  const loadExistingEpisodes = async () => {
    if (!editingSubmission?.id) return
    try {
      const result = await getSubmissionEpisodes(editingSubmission.id)
      if (result.success && result.episodes) {
        setExistingEpisodes(
          result.episodes.map((ep: any) => ({
            episodeNumber: ep.episodeNumber,
            seasonNumber: ep.seasonNumber,
            title: ep.title,
            videoUrl: ep.videoUrl,
            duration: ep.duration || "",
          })),
        )
      }
    } catch (error) {
      console.error("Failed to load existing episodes:", error)
    }
  }

  // Generate episode slots when total episodes changes
  useEffect(() => {
    if (contentType === "series" && totalEpisodes && !editingSubmission) {
      const count = Number.parseInt(totalEpisodes) || 0
      const newEpisodes: Episode[] = []
      for (let i = 1; i <= count; i++) {
        newEpisodes.push({
          episodeNumber: i,
          seasonNumber: Number.parseInt(seasonNumber) || 1,
          title: `Episode ${i}`,
          videoUrl: "",
          duration: "",
          videoFile: null,
          videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
        })
      }
      setEpisodes(newEpisodes)
    }
  }, [totalEpisodes, seasonNumber, contentType, editingSubmission])

  const uploadVideoFile = async (
    file: File,
    episodeTitle?: string,
    onProgress?: (progress: number) => void,
  ): Promise<string | null> => {
    try {
      console.log("[v0] Starting client-side Blob upload for:", file.name)
      onProgress?.(10)

      // Step 1: Upload directly to Blob from client
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const pathname = `creator-videos/${timestamp}-${safeFileName}`

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/blob-token",
      })

      console.log("[v0] Blob upload complete:", blob.url)
      onProgress?.(60)

      // Step 2: Process Blob URL through VOE (if configured)
      const processResponse = await fetch("/api/upload/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          title: episodeTitle || title || file.name,
        }),
      })

      onProgress?.(90)

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        console.error("[v0] Process video failed:", errorData)
        // Use Blob URL as fallback
        return blob.url
      }

      const result = await processResponse.json()
      onProgress?.(100)

      if (result.success && result.embedUrl) {
        return result.embedUrl
      }

      // Use Blob URL as fallback
      return blob.url
    } catch (error: any) {
      console.error("[v0] Video upload error:", error)
      throw error
    }
  }

  const uploadThumbnailFile = async (file: File, onProgress?: (progress: number) => void): Promise<string | null> => {
    try {
      console.log("[v0] Starting client-side Blob upload for thumbnail:", file.name)
      onProgress?.(10)

      // Step 1: Upload directly to Blob from client
      const timestamp = Date.now()
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const pathname = `creator-thumbnails/${timestamp}-${safeFileName}`

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/blob-token",
      })

      console.log("[v0] Thumbnail Blob upload complete:", blob.url)
      onProgress?.(60)

      // Step 2: Process through Publitio (if configured)
      const processResponse = await fetch("/api/upload/process-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url }),
      })

      onProgress?.(90)

      if (!processResponse.ok) {
        // Use Blob URL as fallback
        return blob.url
      }

      const result = await processResponse.json()
      onProgress?.(100)

      if (result.success && result.cdnUrl) {
        return result.cdnUrl
      }

      return blob.url
    } catch (error: any) {
      console.error("[v0] Thumbnail upload error:", error)
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

    try {
      const resultUrl = await uploadVideoFile(file, undefined, (progress) => {
        setVideoUploadStatus((prev) => ({ ...prev, progress }))
      })

      if (resultUrl) {
        setVideoUploadStatus({
          file,
          status: "success",
          progress: 100,
          resultUrl,
          error: null,
        })
        setVideoUrl(resultUrl)
        toast.success("Video uploaded successfully!")
      } else {
        throw new Error("No URL returned")
      }
    } catch (error: any) {
      console.error("[v0] Video upload failed:", error)
      setVideoUploadStatus({
        file,
        status: "error",
        progress: 0,
        resultUrl: null,
        error: error.message || "Upload failed",
      })
      toast.error(`Video upload failed: ${error.message}`)
    }
  }

  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i
    if (!file.name.match(allowedExtensions)) {
      toast.error("Invalid file type. Allowed: jpg, jpeg, png, webp")
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 15MB")
      return
    }

    setSelectedThumbnailFile(file)
    setThumbnailUploadStatus({
      file,
      status: "uploading",
      progress: 10,
      resultUrl: null,
      error: null,
    })

    toast.info(`Uploading thumbnail: ${file.name}...`)

    try {
      const resultUrl = await uploadThumbnailFile(file, (progress) => {
        setThumbnailUploadStatus((prev) => ({ ...prev, progress }))
      })

      if (resultUrl) {
        setThumbnailUploadStatus({
          file,
          status: "success",
          progress: 100,
          resultUrl,
          error: null,
        })
        setThumbnailUrl(resultUrl)
        toast.success("Thumbnail uploaded successfully!")
      } else {
        throw new Error("No URL returned")
      }
    } catch (error: any) {
      console.error("[v0] Thumbnail upload failed:", error)
      setThumbnailUploadStatus({
        file,
        status: "error",
        progress: 0,
        resultUrl: null,
        error: error.message || "Upload failed",
      })
      toast.error(`Thumbnail upload failed: ${error.message}`)
    }
  }

  const handleEpisodeVideoSelect = async (episodeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExtensions = /\.(mp4|webm|mkv|avi|mov)$/i
    if (!file.name.match(allowedExtensions)) {
      toast.error("Invalid file type. Allowed: mp4, webm, mkv, avi, mov")
      return
    }

    const updatedEpisodes = [...episodes]
    updatedEpisodes[episodeIndex] = {
      ...updatedEpisodes[episodeIndex],
      videoFile: file,
      videoUploadStatus: {
        file,
        status: "uploading",
        progress: 10,
        resultUrl: null,
        error: null,
      },
    }
    setEpisodes(updatedEpisodes)

    toast.info(`Uploading Episode ${episodeIndex + 1} video...`)

    try {
      const resultUrl = await uploadVideoFile(file, updatedEpisodes[episodeIndex].title, (progress) => {
        setEpisodes((prev) => {
          const updated = [...prev]
          updated[episodeIndex] = {
            ...updated[episodeIndex],
            videoUploadStatus: { ...updated[episodeIndex].videoUploadStatus!, progress },
          }
          return updated
        })
      })

      if (resultUrl) {
        setEpisodes((prev) => {
          const updated = [...prev]
          updated[episodeIndex] = {
            ...updated[episodeIndex],
            videoUrl: resultUrl,
            videoUploadStatus: {
              file,
              status: "success",
              progress: 100,
              resultUrl,
              error: null,
            },
          }
          return updated
        })
        toast.success(`Episode ${episodeIndex + 1} video uploaded!`)
      }
    } catch (error: any) {
      setEpisodes((prev) => {
        const updated = [...prev]
        updated[episodeIndex] = {
          ...updated[episodeIndex],
          videoUploadStatus: {
            file,
            status: "error",
            progress: 0,
            resultUrl: null,
            error: error.message,
          },
        }
        return updated
      })
      toast.error(`Episode ${episodeIndex + 1} upload failed: ${error.message}`)
    }
  }

  const clearVideoUpload = () => {
    setSelectedVideoFile(null)
    setVideoUrl("")
    setVideoUploadStatus({ file: null, status: "idle", progress: 0, resultUrl: null, error: null })
  }

  const clearThumbnailUpload = () => {
    setSelectedThumbnailFile(null)
    setThumbnailUrl("")
    setThumbnailUploadStatus({ file: null, status: "idle", progress: 0, resultUrl: null, error: null })
  }

  const isAnyUploadInProgress = () => {
    if (videoUploadStatus.status === "uploading") return true
    if (thumbnailUploadStatus.status === "uploading") return true
    if (episodes.some((ep) => ep.videoUploadStatus?.status === "uploading")) return true
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isAnyUploadInProgress()) {
      toast.error("Please wait for uploads to complete")
      return
    }

    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (!description.trim() || description.length < 20) {
      toast.error("Please enter a description (minimum 20 characters)")
      return
    }
    if (!genre) {
      toast.error("Please select a genre")
      return
    }
    if (!thumbnailUrl) {
      toast.error("Please upload or provide a thumbnail URL")
      return
    }

    if (contentType === "movie") {
      if (!videoUrl) {
        toast.error("Please upload or provide a video URL")
        return
      }
    } else {
      const episodesWithVideo = episodes.filter((ep) => ep.videoUrl)
      if (episodesWithVideo.length === 0) {
        toast.error("Please upload at least one episode")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const result = await submitContent({
        type: contentType,
        title: title.trim(),
        description: description.trim(),
        genre,
        year: Number.parseInt(year),
        videoUrl: contentType === "movie" ? videoUrl : undefined,
        thumbnailUrl,
        seasonNumber: contentType === "series" ? Number.parseInt(seasonNumber) : undefined,
        episodes:
          contentType === "series"
            ? episodes
                .filter((ep) => ep.videoUrl)
                .map((ep) => ({
                  episodeNumber: ep.episodeNumber,
                  seasonNumber: ep.seasonNumber,
                  title: ep.title,
                  videoUrl: ep.videoUrl,
                  duration: ep.duration,
                }))
            : undefined,
      })

      if (result.success) {
        toast.success(result.message || "Content submitted for review!")
        // Reset form
        setTitle("")
        setDescription("")
        setGenre("")
        setVideoUrl("")
        setThumbnailUrl("")
        setEpisodes([])
        setTotalEpisodes("")
        clearVideoUpload()
        clearThumbnailUpload()
        onSubmitSuccess?.()
      } else {
        toast.error(result.error || "Submission failed")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddEpisodes = async () => {
    if (!editingSubmission?.id) return

    const newEpisodes = episodes.filter((ep) => ep.videoUrl)
    if (newEpisodes.length === 0) {
      toast.error("Please upload at least one episode")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addEpisodesToSubmission(editingSubmission.id, newEpisodes)
      if (result.success) {
        toast.success("Episodes added successfully!")
        setEpisodes([])
        onSubmitSuccess?.()
      } else {
        toast.error(result.error || "Failed to add episodes")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderUploadStatusBadge = (status: UploadStatus) => {
    if (status.status === "idle") return null
    if (status.status === "uploading") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {status.progress}%
        </Badge>
      )
    }
    if (status.status === "success") {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Check className="h-3 w-3" />
          Uploaded
        </Badge>
      )
    }
    if (status.status === "error") {
      return (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Failed
        </Badge>
      )
    }
    return null
  }

  // If editing a series, show simplified add episodes UI
  if (editingSubmission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Add Episodes to: {editingSubmission.title}</span>
            <Button variant="outline" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingEpisodes.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Episodes</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {existingEpisodes.map((ep) => (
                  <div
                    key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                    className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                  >
                    <Badge variant="outline">
                      S{ep.seasonNumber}E{ep.episodeNumber}
                    </Badge>
                    <span className="truncate">{ep.title}</span>
                    <Check className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Add New Episodes</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Number of new episodes"
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(e.target.value)}
                min="1"
                max="50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const count = Number.parseInt(totalEpisodes) || 0
                  const startEp = existingEpisodes.length + 1
                  const newEps: Episode[] = []
                  for (let i = 0; i < count; i++) {
                    newEps.push({
                      episodeNumber: startEp + i,
                      seasonNumber: editingSubmission.seasonNumber || 1,
                      title: `Episode ${startEp + i}`,
                      videoUrl: "",
                      duration: "",
                      videoFile: null,
                      videoUploadStatus: { file: null, status: "idle", progress: 0, resultUrl: null, error: null },
                    })
                  }
                  setEpisodes(newEps)
                }}
              >
                Generate Slots
              </Button>
            </div>
          </div>

          {episodes.length > 0 && (
            <div className="space-y-3">
              {episodes.map((episode, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>
                      S{episode.seasonNumber}E{episode.episodeNumber}
                    </Badge>
                    <Input
                      value={episode.title}
                      onChange={(e) => {
                        const updated = [...episodes]
                        updated[index].title = e.target.value
                        setEpisodes(updated)
                      }}
                      placeholder="Episode title"
                      className="flex-1"
                    />
                    {renderUploadStatusBadge(
                      episode.videoUploadStatus || {
                        file: null,
                        status: "idle",
                        progress: 0,
                        resultUrl: null,
                        error: null,
                      },
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleEpisodeVideoSelect(index, e)}
                        disabled={episode.videoUploadStatus?.status === "uploading"}
                      />
                    </div>
                    <span className="text-muted-foreground text-sm self-center">or</span>
                    <Input
                      placeholder="Video URL"
                      value={episode.videoUrl}
                      onChange={(e) => {
                        const updated = [...episodes]
                        updated[index].videoUrl = e.target.value
                        setEpisodes(updated)
                      }}
                      className="flex-1"
                      disabled={episode.videoUploadStatus?.status === "uploading"}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button
            onClick={handleAddEpisodes}
            disabled={isSubmitting || isAnyUploadInProgress() || episodes.filter((ep) => ep.videoUrl).length === 0}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Episodes...
              </>
            ) : isAnyUploadInProgress() ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for uploads...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {episodes.filter((ep) => ep.videoUrl).length} Episode(s)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload New Content</span>
            <div className="flex gap-2 text-sm font-normal">
              <Badge variant="outline">Uploads: {dailyUploadsRemaining} left</Badge>
              <Badge variant="outline">Storage: {dailyStorageRemaining.toFixed(1)}GB left</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Tabs */}
          <Tabs value={contentType} onValueChange={(v) => setContentType(v as "movie" | "series")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="movie" className="gap-2">
                <Film className="h-4 w-4" />
                Movie
              </TabsTrigger>
              <TabsTrigger value="series" className="gap-2">
                <Tv className="h-4 w-4" />
                Series
              </TabsTrigger>
            </TabsList>

            {/* Common Fields */}
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (minimum 20 characters)"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              {/* Upload Mode Toggle */}
              <div className="flex items-center gap-4">
                <Label>Upload Method:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={uploadMode === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("file")}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Files
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("url")}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Paste URLs
                  </Button>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Thumbnail *{renderUploadStatusBadge(thumbnailUploadStatus)}
                </Label>
                {uploadMode === "file" ? (
                  <div className="space-y-2">
                    {thumbnailUploadStatus.status === "success" ? (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <img
                          src={thumbnailUploadStatus.resultUrl || ""}
                          alt="Thumbnail preview"
                          className="w-20 h-12 object-cover rounded"
                        />
                        <span className="flex-1 text-sm truncate">{thumbnailUploadStatus.file?.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={clearThumbnailUpload}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : thumbnailUploadStatus.status === "uploading" ? (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="flex-1 text-sm">{thumbnailUploadStatus.file?.name}</span>
                        <span className="text-sm font-medium">{thumbnailUploadStatus.progress}%</span>
                      </div>
                    ) : thumbnailUploadStatus.status === "error" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="flex-1 text-sm text-red-500">{thumbnailUploadStatus.error}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={clearThumbnailUpload}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleThumbnailFileSelect}
                        />
                      </div>
                    ) : (
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbnailFileSelect}
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                )}
              </div>

              {/* Movie-specific fields */}
              <TabsContent value="movie" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Video *{renderUploadStatusBadge(videoUploadStatus)}</Label>
                  {uploadMode === "file" ? (
                    <div className="space-y-2">
                      {videoUploadStatus.status === "success" ? (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <Film className="h-5 w-5 text-green-500" />
                          <span className="flex-1 text-sm truncate">{videoUploadStatus.file?.name}</span>
                          <Check className="h-4 w-4 text-green-500" />
                          <Button type="button" variant="ghost" size="sm" onClick={clearVideoUpload}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : videoUploadStatus.status === "uploading" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="flex-1 text-sm">{videoUploadStatus.file?.name}</span>
                            <span className="text-sm font-medium">{videoUploadStatus.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${videoUploadStatus.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : videoUploadStatus.status === "error" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="flex-1 text-sm text-red-500">{videoUploadStatus.error}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={clearVideoUpload}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            type="file"
                            accept="video/mp4,video/webm,video/x-matroska,video/avi,video/quicktime"
                            onChange={handleVideoFileSelect}
                          />
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept="video/mp4,video/webm,video/x-matroska,video/avi,video/quicktime"
                          onChange={handleVideoFileSelect}
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://voe.sx/e/xxxxx or video embed URL"
                    />
                  )}
                </div>
              </TabsContent>

              {/* Series-specific fields */}
              <TabsContent value="series" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Season Number</Label>
                    <Input
                      type="number"
                      value={seasonNumber}
                      onChange={(e) => setSeasonNumber(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Episodes</Label>
                    <Input
                      type="number"
                      value={totalEpisodes}
                      onChange={(e) => setTotalEpisodes(e.target.value)}
                      min="1"
                      max="50"
                      placeholder="Number of episodes"
                    />
                  </div>
                </div>

                {episodes.length > 0 && (
                  <div className="space-y-3">
                    <Label>Episodes</Label>
                    {episodes.map((episode, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Ep {episode.episodeNumber}</Badge>
                          <Input
                            value={episode.title}
                            onChange={(e) => {
                              const updated = [...episodes]
                              updated[index].title = e.target.value
                              setEpisodes(updated)
                            }}
                            placeholder="Episode title"
                            className="flex-1"
                          />
                          {renderUploadStatusBadge(
                            episode.videoUploadStatus || {
                              file: null,
                              status: "idle",
                              progress: 0,
                              resultUrl: null,
                              error: null,
                            },
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          {uploadMode === "file" ? (
                            <>
                              {episode.videoUploadStatus?.status === "success" ? (
                                <div className="flex-1 flex items-center gap-2 p-2 bg-green-500/10 rounded">
                                  <Check className="h-4 w-4 text-green-500" />
                                  <span className="text-sm truncate">{episode.videoFile?.name || "Uploaded"}</span>
                                </div>
                              ) : episode.videoUploadStatus?.status === "uploading" ? (
                                <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">{episode.videoUploadStatus.progress}%</span>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleEpisodeVideoSelect(index, e)}
                                  className="flex-1"
                                />
                              )}
                            </>
                          ) : (
                            <Input
                              placeholder="Video URL"
                              value={episode.videoUrl}
                              onChange={(e) => {
                                const updated = [...episodes]
                                updated[index].videoUrl = e.target.value
                                setEpisodes(updated)
                              }}
                              className="flex-1"
                            />
                          )}
                          <Input
                            placeholder="Duration (e.g., 45m)"
                            value={episode.duration}
                            onChange={(e) => {
                              const updated = [...episodes]
                              updated[index].duration = e.target.value
                              setEpisodes(updated)
                            }}
                            className="w-28"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting || isAnyUploadInProgress()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isAnyUploadInProgress() ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for uploads...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
