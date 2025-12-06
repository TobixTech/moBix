"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import MobixIntro from "./mobix-intro"
import PrerollAdPlayer from "./preroll-ad-player"
import MidrollAdPlayer from "./midroll-ad-player"
import { updateWatchProgress } from "@/lib/server-actions"
import { Play, RotateCw, X, Maximize2, Minimize2, RefreshCw } from "lucide-react"

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

function isEmbedUrl(url: string): boolean {
  if (!url) return false
  const embedPatterns = [
    "youtube.com/embed",
    "youtube.com/watch",
    "youtu.be",
    "vimeo.com",
    "dailymotion.com",
    "drive.google.com",
    "iframe",
    "embed",
    // Streamtape domains
    "streamtape.com",
    "streamtape.to",
    "streamtape.net",
    "strtape.cloud",
    "strcloud.link",
    "strtpe.link",
    "stape.fun",
    // Other common video hosts
    "doodstream.com",
    "filemoon.sx",
    "filemoon.to",
    "vidoza.net",
    "upstream.to",
    "mixdrop.co",
    "mp4upload.com",
    "streamsb.net",
    "streamwish.to",
    "vidhide.com",
    "vtube.to",
  ]
  return embedPatterns.some((pattern) => url.toLowerCase().includes(pattern))
}

function getEmbedUrl(url: string): string {
  if (!url) return ""

  const lowerUrl = url.toLowerCase()

  // YouTube
  if (lowerUrl.includes("youtube.com/watch")) {
    const videoId = new URL(url).searchParams.get("v")
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
  }
  if (lowerUrl.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
  }
  if (lowerUrl.includes("youtube.com/embed")) {
    return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1&rel=0&modestbranding=1`
  }

  // Vimeo
  if (lowerUrl.includes("vimeo.com/") && !lowerUrl.includes("/video/")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
    return `https://player.vimeo.com/video/${videoId}?autoplay=1`
  }

  // Streamtape - convert to /e/ embed URL
  if (
    lowerUrl.includes("streamtape.com") ||
    lowerUrl.includes("streamtape.to") ||
    lowerUrl.includes("streamtape.net") ||
    lowerUrl.includes("strtape.cloud") ||
    lowerUrl.includes("strcloud.link") ||
    lowerUrl.includes("strtpe.link") ||
    lowerUrl.includes("stape.fun")
  ) {
    // If already an embed URL with /e/, return as is
    if (url.includes("/e/")) {
      return url
    }
    // Convert /v/ to /e/ for embed
    if (url.includes("/v/")) {
      return url.replace("/v/", "/e/")
    }
    // Return as-is if neither pattern matches
    return url
  }

  // Return URL as-is for other embed URLs
  return url
}

function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return false
  try {
    new URL(url)
    return true
  } catch {
    return url.startsWith("/") || isEmbedUrl(url)
  }
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
  const [isRotated, setIsRotated] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastProgressUpdate = useRef(0)
  const embeddedStartTime = useRef<number>(0)
  const embeddedIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isEmbed = isEmbedUrl(videoUrl)

  useEffect(() => {
    console.log("[v0] Video URL:", videoUrl)
    console.log("[v0] Is Embed:", isEmbed)
    console.log("[v0] Embed URL:", getEmbedUrl(videoUrl))
  }, [videoUrl, isEmbed])

  const handleRotate = useCallback(() => {
    setIsRotated((prev) => !prev)
    if (screen.orientation && "lock" in screen.orientation) {
      if (!isRotated) {
        ;(screen.orientation as any).lock?.("landscape").catch(() => {})
      } else {
        ;(screen.orientation as any).unlock?.()
      }
    }
  }, [isRotated])

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
        if (window.innerWidth < 768) {
          setIsRotated(true)
          if (screen.orientation && "lock" in screen.orientation) {
            ;(screen.orientation as any).lock?.("landscape").catch(() => {})
          }
        }
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        setIsRotated(false)
        if (screen.orientation && "unlock" in screen.orientation) {
          ;(screen.orientation as any).unlock?.()
        }
      }
    } catch (err) {
      console.error("[v0] Fullscreen error:", err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement) {
        setIsRotated(false)
        if (screen.orientation && "unlock" in screen.orientation) {
          ;(screen.orientation as any).unlock?.()
        }
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRotated && !isFullscreen) {
        setIsRotated(false)
        if (screen.orientation && "unlock" in screen.orientation) {
          ;(screen.orientation as any).unlock?.()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRotated, isFullscreen])

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
        if (embeddedIntervalRef.current) clearInterval(embeddedIntervalRef.current)
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
    if (!isValidUrl(videoUrl)) {
      setHasError(true)
      setShowVideo(true)
      return
    }
    const hasPrerollAds =
      showPrerollAds && prerollAdCodes.length > 0 && prerollAdCodes.some((ad) => ad.code && ad.code.trim() !== "")
    if (hasPrerollAds) {
      setShowPrerollAd(true)
    } else {
      setShowVideo(true)
      if (!isEmbed) setHasStartedPlaying(true)
    }
  }

  const handlePrerollAdComplete = () => {
    setShowPrerollAd(false)
    setShowVideo(true)
    if (!isValidUrl(videoUrl)) {
      setHasError(true)
      return
    }
    if (!isEmbed) setHasStartedPlaying(true)
  }

  const handleMidrollAdComplete = () => {
    setShowMidrollAd(false)
    if (videoRef.current) videoRef.current.play()
  }

  const handleEmbedPlay = () => {
    console.log("[v0] handleEmbedPlay called, URL:", videoUrl)
    if (!isValidUrl(videoUrl)) {
      console.log("[v0] Invalid URL detected")
      setHasError(true)
      return
    }
    setHasStartedPlaying(true)
    setHasError(false)
    setIframeLoaded(false)
  }

  const handleRetry = () => {
    setHasError(false)
    setRetryCount((prev) => prev + 1)
    setHasStartedPlaying(false)
    setIframeLoaded(false)
    setTimeout(() => {
      if (isEmbed) {
        setHasStartedPlaying(true)
      } else if (videoRef.current) {
        videoRef.current.load()
        videoRef.current.play().catch(() => setHasError(true))
      }
    }, 100)
  }

  const handleVideoError = () => {
    console.log("[v0] Video error occurred")
    setHasError(true)
  }

  const handleIframeLoad = () => {
    console.log("[v0] Iframe loaded successfully")
    setIframeLoaded(true)
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

  const getContainerStyles = (): React.CSSProperties => {
    if (isRotated && !isFullscreen) {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vh",
        height: "100vw",
        transform: "rotate(90deg) translateY(-100%)",
        transformOrigin: "top left",
        zIndex: 9999,
        backgroundColor: "#000",
      }
    }
    return {}
  }

  return (
    <>
      {isRotated && !isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-[9998]" onClick={() => setIsRotated(false)} />
      )}

      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-[#0B0C10] rounded-xl overflow-hidden border border-[#2A2B33] shadow-2xl transition-all duration-500 ease-in-out ${
          isRotated && !isFullscreen ? "rounded-none border-0" : ""
        }`}
        style={getContainerStyles()}
      >
        {/* Rotate/Fullscreen controls */}
        {showVideo && hasStartedPlaying && !hasError && (
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
            <button
              onClick={handleRotate}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
                isRotated
                  ? "bg-cyan-500/90 text-black shadow-lg shadow-cyan-500/50"
                  : "bg-black/60 text-white hover:bg-black/80 hover:scale-105"
              }`}
              title={isRotated ? "Exit rotation" : "Rotate to landscape"}
            >
              {isRotated ? <X className="w-5 h-5" /> : <RotateCw className="w-5 h-5" />}
            </button>
            <button
              onClick={handleFullscreen}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
                isFullscreen
                  ? "bg-cyan-500/90 text-black shadow-lg shadow-cyan-500/50"
                  : "bg-black/60 text-white hover:bg-black/80 hover:scale-105"
              }`}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Rotation hint */}
        {showVideo && !hasStartedPlaying && !isRotated && !hasError && (
          <div className="absolute top-3 right-3 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-gray-300">
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotation available</span>
            </div>
          </div>
        )}

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

        {/* Error state */}
        {showVideo && hasError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0C10] to-[#1A1B23]">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                Sorry, this video cannot be played right now. Please try again or contact support.
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              {retryCount > 2 && (
                <p className="text-gray-500 text-sm mt-4">
                  Still having issues? The video URL may be invalid or restricted.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Video content */}
        {showVideo && !hasError && (
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
                  <>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-gray-400 text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      ref={iframeRef}
                      key={`${retryCount}-${videoUrl}`}
                      src={getEmbedUrl(videoUrl)}
                      title={title}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      scrolling="no"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                      referrerPolicy="no-referrer-when-downgrade"
                      loading="eager"
                      style={{
                        border: "none",
                        pointerEvents: "auto",
                        backgroundColor: "#000",
                      }}
                      onLoad={handleIframeLoad}
                      onError={handleVideoError}
                    />
                  </>
                )}
              </div>
            ) : (
              <video
                ref={videoRef}
                key={retryCount}
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                controlsList="nodownload"
                className="w-full h-full object-contain"
                style={{ backgroundColor: "#000" }}
                onError={handleVideoError}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </>
        )}
      </div>
    </>
  )
}
