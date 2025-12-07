"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Maximize, Minimize, RotateCcw, RefreshCw, AlertCircle } from "lucide-react"
import { MobixVideoLoader } from "./mobix-video-loader"

interface ProductionVideoPlayerProps {
  videoUrl: string
  title: string
  posterUrl?: string
  onProgress?: (progress: number, duration: number) => void
  initialProgress?: number
  movieId?: string
  prerollAdCodes?: string[]
  midrollAdCodes?: string[]
  midrollEnabled?: boolean
  midrollIntervalMinutes?: number
}

export function ProductionVideoPlayer({
  videoUrl,
  title,
  posterUrl,
  onProgress,
  initialProgress = 0,
  movieId,
  prerollAdCodes = [],
  midrollAdCodes = [],
  midrollEnabled = false,
  midrollIntervalMinutes = 20,
}: ProductionVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRotated, setIsRotated] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [showPlayOverlay, setShowPlayOverlay] = useState(true)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const isYouTubeUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase()
    return (
      lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("youtube-nocookie.com")
    )
  }

  // Check if URL is an embedded video (YouTube, Vimeo, Streamtape, etc.)
  const isEmbedUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase()
    const embedDomains = [
      "youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "vimeo.com",
      "dailymotion.com",
      "streamtape.com",
      "streamtape.to",
      "strtape.cloud",
      "strcloud.link",
      "doodstream.com",
      "dood.to",
      "dood.watch",
      "dood.so",
      "dood.pm",
      "dood.wf",
      "dood.re",
      "mixdrop.co",
      "mixdrop.to",
      "mixdrop.sx",
      "mixdrop.bz",
      "mixdrop.ch",
      "vidhide.com",
      "vidhidepro.com",
      "streamwish.com",
      "streamwish.to",
      "wishembed.pro",
      "strwish.xyz",
      "filemoon.sx",
      "filemoon.to",
      "filemoon.in",
      "voe.sx",
      "voeunblock.com",
      "voe-unblock.com",
      "vidmoly.to",
      "vidmoly.me",
      "upstream.to",
      "mp4upload.com",
      "uqload.com",
      "uqload.to",
      "wolfstream.tv",
      "embedsito.com",
      "closeload.com",
      "vidguard.to",
      "vembed.net",
      "player.vimeo.com",
      "embed",
      "/e/",
      "/v/",
    ]
    return embedDomains.some((domain) => lowerUrl.includes(domain))
  }

  // Convert URL to proper embed format
  const getEmbedUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase()

    // YouTube - multiple formats
    if (lowerUrl.includes("youtube.com/watch")) {
      try {
        const videoId = new URL(url).searchParams.get("v")
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
      } catch {
        return url
      }
    }
    if (lowerUrl.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    }
    if (lowerUrl.includes("youtube.com/embed")) {
      return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1&rel=0&modestbranding=1`
    }
    if (lowerUrl.includes("youtube.com/v/")) {
      const videoId = url.split("/v/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    }

    // Vimeo
    if (lowerUrl.includes("vimeo.com") && !lowerUrl.includes("player.vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }

    // Streamtape - convert /v/ to /e/
    if (
      lowerUrl.includes("streamtape.com") ||
      lowerUrl.includes("streamtape.to") ||
      lowerUrl.includes("strtape.cloud") ||
      lowerUrl.includes("strcloud.link")
    ) {
      if (lowerUrl.includes("/v/")) {
        return url.replace("/v/", "/e/")
      }
      return url
    }

    // Doodstream - convert to embed
    if (
      lowerUrl.includes("doodstream.com") ||
      lowerUrl.includes("dood.to") ||
      lowerUrl.includes("dood.watch") ||
      lowerUrl.includes("dood.so") ||
      lowerUrl.includes("dood.pm") ||
      lowerUrl.includes("dood.wf") ||
      lowerUrl.includes("dood.re")
    ) {
      if (lowerUrl.includes("/d/")) {
        return url.replace("/d/", "/e/")
      }
      return url
    }

    // Mixdrop - convert to embed
    if (
      lowerUrl.includes("mixdrop.co") ||
      lowerUrl.includes("mixdrop.to") ||
      lowerUrl.includes("mixdrop.sx") ||
      lowerUrl.includes("mixdrop.bz") ||
      lowerUrl.includes("mixdrop.ch")
    ) {
      if (lowerUrl.includes("/f/")) {
        return url.replace("/f/", "/e/")
      }
      return url
    }

    // Voe - convert to embed
    if (lowerUrl.includes("voe.sx") || lowerUrl.includes("voeunblock") || lowerUrl.includes("voe-unblock")) {
      if (!lowerUrl.includes("/e/")) {
        const parts = url.split("/")
        const videoId = parts[parts.length - 1]
        return `https://voe.sx/e/${videoId}`
      }
      return url
    }

    // Filemoon
    if (lowerUrl.includes("filemoon.sx") || lowerUrl.includes("filemoon.to") || lowerUrl.includes("filemoon.in")) {
      if (!lowerUrl.includes("/e/")) {
        return url.replace("/d/", "/e/")
      }
      return url
    }

    return url
  }

  const handleVideoError = useCallback(() => {
    console.error("[v0] Video error occurred for URL:", videoUrl)
    setHasError(true)
    setErrorMessage("Failed to load video. Please try again.")
  }, [videoUrl])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setErrorMessage("")
    setRetryCount((prev) => prev + 1)
    setIframeLoaded(false)
  }, [])

  const handleIframeLoad = useCallback(() => {
    console.log("[v0] Iframe loaded successfully")
    setIframeLoaded(true)
  }, [])

  const handlePlayClick = useCallback(() => {
    setShowPlayOverlay(false)
    setIsPlaying(true)
  }, [])

  const toggleRotation = useCallback(() => {
    setIsRotated((prev) => !prev)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("[v0] Fullscreen error:", error)
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Escape key to exit rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRotated) {
        setIsRotated(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isRotated])

  const getReferrerPolicy = (): React.HTMLAttributeReferrerPolicy => {
    if (isYouTubeUrl(videoUrl)) {
      return "origin-when-cross-origin"
    }
    // For other embeds like Streamtape, use no-referrer
    return "no-referrer"
  }

  const isEmbed = isEmbedUrl(videoUrl)

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${
        isRotated
          ? "fixed inset-0 z-[99999] flex items-center justify-center bg-black"
          : "w-full aspect-video rounded-xl"
      }`}
    >
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Video Playback Error</h3>
          <p className="text-gray-400 text-center mb-4 max-w-md">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-full transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      ) : (
        <>
          {isEmbed ? (
            <div className={`relative ${isRotated ? "w-screen h-screen" : "w-full h-full"}`}>
              {/* Play overlay for embeds */}
              {showPlayOverlay ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-cover bg-center cursor-pointer z-10"
                  style={{
                    backgroundImage: posterUrl ? `url(${posterUrl})` : undefined,
                    backgroundColor: posterUrl ? undefined : "#1a1a2e",
                  }}
                  onClick={handlePlayClick}
                >
                  <div className="absolute inset-0 bg-black/50" />
                  <button className="relative z-10 w-20 h-20 md:w-24 md:h-24 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl">
                    <Play className="w-10 h-10 md:w-12 md:h-12 text-black fill-black ml-1" />
                  </button>
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-white text-lg font-semibold drop-shadow-lg">{title}</p>
                    <p className="text-gray-300 text-sm">Click to play</p>
                  </div>
                </div>
              ) : (
                <>
                  {!iframeLoaded && <MobixVideoLoader />}
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
                    referrerPolicy={getReferrerPolicy()}
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

              {/* Controls overlay for embeds */}
              {!showPlayOverlay && (
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <button
                    onClick={toggleRotation}
                    className={`p-2 rounded-full transition-all ${
                      isRotated ? "bg-cyan-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                    title={isRotated ? "Exit rotation" : "Rotate to landscape"}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {/* Exit rotation button */}
              {isRotated && (
                <button
                  onClick={() => setIsRotated(false)}
                  className="absolute top-4 left-4 z-[100000] p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                >
                  <span className="sr-only">Exit rotation</span>✕
                </button>
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
  )
}

export default ProductionVideoPlayer
