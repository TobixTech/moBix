"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import MobixIntro from "./mobix-intro"
import PrerollAdPlayer from "./preroll-ad-player"
import MidrollAdPlayer from "./midroll-ad-player"
import { updateWatchProgress } from "@/lib/server-actions"
import { Play } from "lucide-react"

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
  movieDuration?: number
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
  movieDuration = 120,
}: ProductionVideoPlayerProps) {
  const [showIntro, setShowIntro] = useState(!skipIntro)
  const [showPrerollAd, setShowPrerollAd] = useState(false)
  const [showMidrollAd, setShowMidrollAd] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)
  const [lastMidrollTime, setLastMidrollTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastProgressUpdate = useRef(0)
  const embeddedStartTime = useRef<number>(0)
  const embeddedIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isEmbed = isEmbedUrl(videoUrl)

  const saveProgress = useCallback(async () => {
    if (!movieId || !videoRef.current) return

    const video = videoRef.current
    const progress = Math.floor((video.currentTime / video.duration) * 100)
    const duration = Math.floor(video.duration)

    if (Math.abs(progress - lastProgressUpdate.current) >= 5) {
      lastProgressUpdate.current = progress
      await updateWatchProgress(movieId, progress, duration)
    }
  }, [movieId])

  const saveEmbeddedProgress = useCallback(async () => {
    if (!movieId) return

    const elapsedMinutes = (Date.now() - embeddedStartTime.current) / 1000 / 60
    const estimatedDuration = movieDuration
    const progress = Math.min(Math.floor((elapsedMinutes / estimatedDuration) * 100), 95)

    if (progress > lastProgressUpdate.current && progress >= 5) {
      lastProgressUpdate.current = progress
      await updateWatchProgress(movieId, progress, estimatedDuration * 60)
    }
  }, [movieId, movieDuration])

  useEffect(() => {
    if (!showVideo || !movieId) return

    if (isEmbed) {
      embeddedStartTime.current = Date.now()
      embeddedIntervalRef.current = setInterval(saveEmbeddedProgress, 30000)
      const handleBeforeUnload = () => saveEmbeddedProgress()
      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        if (embeddedIntervalRef.current) {
          clearInterval(embeddedIntervalRef.current)
        }
        window.removeEventListener("beforeunload", handleBeforeUnload)
        saveEmbeddedProgress()
      }
    } else {
      const video = videoRef.current
      if (!video) return

      const interval = setInterval(saveProgress, 30000)
      const handlePause = () => saveProgress()
      const handleBeforeUnload = () => saveProgress()

      video.addEventListener("pause", handlePause)
      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        clearInterval(interval)
        video.removeEventListener("pause", handlePause)
        window.removeEventListener("beforeunload", handleBeforeUnload)
        saveProgress()
      }
    }
  }, [showVideo, movieId, saveProgress, saveEmbeddedProgress, isEmbed])

  const handleIntroComplete = () => {
    setShowIntro(false)
    const hasPrerollAds =
      showPrerollAds && prerollAdCodes.length > 0 && prerollAdCodes.some((ad) => ad.code && ad.code.trim() !== "")
    if (hasPrerollAds) {
      setShowPrerollAd(true)
    } else {
      setShowVideo(true)
      if (!isEmbed) {
        setHasStartedPlaying(true)
      }
    }
  }

  const handlePrerollAdComplete = () => {
    setShowPrerollAd(false)
    setShowVideo(true)
    if (!isEmbed) {
      setHasStartedPlaying(true)
    }
  }

  const handleMidrollAdComplete = () => {
    setShowMidrollAd(false)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleEmbedPlay = () => {
    setHasStartedPlaying(true)
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

  function isEmbedUrl(url: string) {
    return (
      url.includes("youtube.com/embed") ||
      url.includes("youtube.com/watch") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("dailymotion.com") ||
      url.includes("drive.google.com") ||
      url.includes("iframe") ||
      url.includes("embed")
    )
  }

  const getEmbedUrl = (url: string) => {
    // YouTube watch URL
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v")
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    }
    // YouTube short URL
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    }
    // YouTube embed URL
    if (url.includes("youtube.com/embed")) {
      const hasParams = url.includes("?")
      return hasParams
        ? `${url}&autoplay=1&playsinline=1&enablejsapi=1`
        : `${url}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    }
    // Vimeo URL
    if (url.includes("vimeo.com/") && !url.includes("/video/")) {
      const videoId = url.split("vimeo.com/")[1].split("?")[0]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }
    return url
  }

  return (
    <div className="relative w-full aspect-video bg-[#0B0C10] rounded-xl overflow-hidden border border-[#2A2B33] shadow-2xl">
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
          {isEmbed ? (
            <div className="w-full h-full relative">
              {!hasStartedPlaying ? (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group"
                  onClick={handleEmbedPlay}
                  style={{
                    backgroundImage: `url(${posterUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                  <button className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#00FFFF] to-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 group-hover:scale-110 group-hover:shadow-cyan-500/60 transition-all duration-300">
                    <Play className="w-10 h-10 md:w-12 md:h-12 text-black fill-black ml-1" />
                  </button>
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-white text-lg font-semibold drop-shadow-lg">{title}</p>
                    <p className="text-gray-300 text-sm">Click to play</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={getEmbedUrl(videoUrl)}
                  title={title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={{ border: "none", pointerEvents: "auto" }}
                />
              )}
            </div>
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
