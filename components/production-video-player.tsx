"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import MobixIntro from "./mobix-intro"
import PrerollAdPlayer from "./preroll-ad-player"
import MidrollAdPlayer from "./midroll-ad-player"
import { updateWatchProgress } from "@/lib/server-actions"

interface PrerollAdCode {
  code: string
  name?: string
}

interface ProductionVideoPlayerProps {
  videoUrl: string
  posterUrl: string
  title: string
  skipIntro?: boolean
  showPrerollAds?: boolean
  midrollEnabled?: boolean
  prerollAdCodes?: PrerollAdCode[]
  midrollAdCodes?: PrerollAdCode[]
  midrollIntervalMinutes?: number
  adTimeout?: number
  skipDelay?: number
  rotationInterval?: number
  movieId?: string
}

export default function ProductionVideoPlayer({
  videoUrl,
  posterUrl,
  title,
  skipIntro = false,
  showPrerollAds = true,
  midrollEnabled = false,
  prerollAdCodes = [],
  midrollAdCodes = [],
  midrollIntervalMinutes = 20,
  adTimeout = 20,
  skipDelay = 10,
  rotationInterval = 5,
  movieId,
}: ProductionVideoPlayerProps) {
  const [showIntro, setShowIntro] = useState(!skipIntro)
  const [showPrerollAd, setShowPrerollAd] = useState(false)
  const [showMidrollAd, setShowMidrollAd] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [lastMidrollTime, setLastMidrollTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastProgressUpdate = useRef(0)

  const saveProgress = useCallback(async () => {
    if (!movieId || !videoRef.current) return

    const video = videoRef.current
    const progress = Math.floor((video.currentTime / video.duration) * 100)
    const duration = Math.floor(video.duration)

    // Only save if progress changed significantly
    if (Math.abs(progress - lastProgressUpdate.current) >= 5) {
      lastProgressUpdate.current = progress
      await updateWatchProgress(movieId, progress, duration)
    }
  }, [movieId])

  useEffect(() => {
    if (!showVideo || !movieId) return

    const video = videoRef.current
    if (!video) return

    // Save progress every 30 seconds
    const interval = setInterval(saveProgress, 30000)

    // Save progress on pause and before unload
    const handlePause = () => saveProgress()
    const handleBeforeUnload = () => saveProgress()

    video.addEventListener("pause", handlePause)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      video.removeEventListener("pause", handlePause)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      saveProgress() // Save on unmount
    }
  }, [showVideo, movieId, saveProgress])

  const handleIntroComplete = () => {
    setShowIntro(false)
    const hasPrerollAds =
      showPrerollAds && prerollAdCodes.length > 0 && prerollAdCodes.some((ad) => ad.code && ad.code.trim() !== "")
    if (hasPrerollAds) {
      setShowPrerollAd(true)
    } else {
      setShowVideo(true)
    }
  }

  const handlePrerollAdComplete = () => {
    setShowPrerollAd(false)
    setShowVideo(true)
  }

  const handleMidrollAdComplete = () => {
    setShowMidrollAd(false)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  useEffect(() => {
    const hasMidrollAds = midrollAdCodes.length > 0 && midrollAdCodes.some((ad) => ad.code && ad.code.trim() !== "")
    if (!midrollEnabled || !showVideo || !hasMidrollAds) return

    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const currentMinutes = video.currentTime / 60
      const intervalMinutes = midrollIntervalMinutes

      if (currentMinutes - lastMidrollTime >= intervalMinutes && currentMinutes >= intervalMinutes) {
        video.pause()
        setLastMidrollTime(currentMinutes)
        setShowMidrollAd(true)
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [midrollEnabled, showVideo, midrollAdCodes, midrollIntervalMinutes, lastMidrollTime])

  const isEmbedUrl = (url: string) => {
    return (
      url.includes("youtube.com/embed") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("dailymotion.com") ||
      url.includes("drive.google.com")
    )
  }

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v")
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`
    }
    if (url.includes("vimeo.com/") && !url.includes("/video/")) {
      const videoId = url.split("vimeo.com/")[1].split("?")[0]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }
    return url
  }

  return (
    <div className="relative w-full aspect-video bg-[#0B0C10] rounded-lg overflow-hidden border border-[#2A2B33]">
      {showIntro && <MobixIntro onComplete={handleIntroComplete} />}

      {showPrerollAd && (
        <PrerollAdPlayer
          adCodes={prerollAdCodes}
          onComplete={handlePrerollAdComplete}
          onSkip={handlePrerollAdComplete}
          maxDuration={adTimeout}
          skipDelay={skipDelay}
          rotationInterval={rotationInterval}
        />
      )}

      {showMidrollAd && (
        <MidrollAdPlayer
          adCodes={midrollAdCodes}
          onComplete={handleMidrollAdComplete}
          onSkip={handleMidrollAdComplete}
          maxDuration={15}
          skipDelay={5}
          rotationInterval={rotationInterval}
        />
      )}

      {showVideo && (
        <>
          {isEmbedUrl(videoUrl) ? (
            <iframe
              src={getEmbedUrl(videoUrl)}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none" }}
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              controls
              autoPlay
              controlsList="nodownload"
              className="w-full h-full object-contain"
              style={{ backgroundColor: "#000" }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </>
      )}
    </div>
  )
}
