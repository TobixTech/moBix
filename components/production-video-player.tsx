"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Maximize, Minimize, RotateCcw, RefreshCw, AlertCircle, X } from "lucide-react"
import { MobixVideoLoader } from "./mobix-video-loader"

interface PrerollAdCode {
  code: string
  name?: string
}

interface ProductionVideoPlayerProps {
  videoUrl: string
  title: string
  posterUrl?: string
  onProgress?: (progress: number, duration: number) => void
  initialProgress?: number
  movieId?: string
  prerollAdCodes?: PrerollAdCode[]
  midrollAdCodes?: PrerollAdCode[]
  midrollEnabled?: boolean
  midrollIntervalMinutes?: number
  showPrerollAds?: boolean
  adTimeout?: number
  skipDelay?: number
  rotationInterval?: number
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
  showPrerollAds = true,
  adTimeout = 30,
  skipDelay = 5,
  rotationInterval = 5,
}: ProductionVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const adContainerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRotated, setIsRotated] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [showPlayOverlay, setShowPlayOverlay] = useState(true)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  const [showPreroll, setShowPreroll] = useState(false)
  const [prerollCountdown, setPrerollCountdown] = useState(skipDelay)
  const [canSkipPreroll, setCanSkipPreroll] = useState(false)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  const isYouTubeUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase()
    return (
      lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("youtube-nocookie.com")
    )
  }

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

  const getEmbedUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase()

    // YouTube - use strict-origin-when-cross-origin compatible embed
    if (lowerUrl.includes("youtube.com/watch")) {
      try {
        const videoId = new URL(url).searchParams.get("v")
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      } catch {
        return url
      }
    }
    if (lowerUrl.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    }
    if (lowerUrl.includes("youtube.com/embed")) {
      if (!url.includes("autoplay")) {
        return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`
      }
      return url
    }

    // Vimeo
    if (lowerUrl.includes("vimeo.com") && !lowerUrl.includes("player.vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    }

    // Streamtape
    if (lowerUrl.includes("streamtape") || lowerUrl.includes("strtape") || lowerUrl.includes("strcloud")) {
      if (lowerUrl.includes("/v/")) return url.replace("/v/", "/e/")
      return url
    }

    // Doodstream
    if (lowerUrl.includes("dood")) {
      if (url.includes("/d/")) return url.replace("/d/", "/e/")
      return url
    }

    // Mixdrop
    if (lowerUrl.includes("mixdrop")) {
      if (url.includes("/f/")) return url.replace("/f/", "/e/")
      return url
    }

    // Voe
    if (lowerUrl.includes("voe.sx") || lowerUrl.includes("voeunblock")) {
      if (!lowerUrl.includes("/e/")) {
        const parts = url.split("/")
        const videoId = parts[parts.length - 1]
        return `https://voe.sx/e/${videoId}`
      }
      return url
    }

    return url
  }

  useEffect(() => {
    if (showPreroll && prerollCountdown > 0) {
      const timer = setTimeout(() => {
        setPrerollCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showPreroll && prerollCountdown === 0) {
      setCanSkipPreroll(true)
    }
  }, [showPreroll, prerollCountdown])

  const handlePlayClick = useCallback(() => {
    if (showPrerollAds && prerollAdCodes.length > 0) {
      setShowPreroll(true)
      setPrerollCountdown(skipDelay)
      setCanSkipPreroll(false)
    } else {
      setShowPlayOverlay(false)
      setIsPlaying(true)
    }
  }, [showPrerollAds, prerollAdCodes, skipDelay])

  const handleSkipPreroll = useCallback(() => {
    setShowPreroll(false)
    setShowPlayOverlay(false)
    setIsPlaying(true)
  }, [])

  const handleVideoError = useCallback(() => {
    setHasError(true)
    setErrorMessage("Failed to load video. Please try again.")
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setErrorMessage("")
    setRetryCount((prev) => prev + 1)
    setIframeLoaded(false)
  }, [])

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true)
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
      console.error("Fullscreen error:", error)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRotated) setIsRotated(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isRotated])

  const getReferrerPolicy = (): React.HTMLAttributeReferrerPolicy => {
    return isYouTubeUrl(videoUrl) ? "strict-origin-when-cross-origin" : "no-referrer"
  }

  const isEmbed = isEmbedUrl(videoUrl)

  const rotatedStyles: React.CSSProperties = isRotated
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vh",
        height: "100vw",
        transform: "rotate(90deg)",
        transformOrigin: "top left",
        marginLeft: "100vw",
        zIndex: 99999,
        backgroundColor: "#000",
      }
    : {}

  return (
    <>
      {isRotated && <div className="fixed inset-0 bg-black z-[99998]" onClick={() => setIsRotated(false)} />}

      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden ${isRotated ? "" : "w-full aspect-video rounded-xl"}`}
        style={rotatedStyles}
      >
        {/* Preroll Ad Overlay */}
        {showPreroll && prerollAdCodes.length > 0 && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 relative">
              <div
                ref={adContainerRef}
                className="absolute inset-0"
                dangerouslySetInnerHTML={{ __html: prerollAdCodes[currentAdIndex]?.code || "" }}
              />
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              {canSkipPreroll ? (
                <button
                  onClick={handleSkipPreroll}
                  className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all shadow-lg"
                >
                  Skip Ad
                </button>
              ) : (
                <div className="px-6 py-3 bg-black/80 text-white font-bold rounded-lg">Skip in {prerollCountdown}s</div>
              )}
            </div>
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded">AD</span>
            </div>
          </div>
        )}

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
              <div className={`relative ${isRotated ? "w-full h-full" : "w-full h-full"}`}>
                {showPlayOverlay && !showPreroll ? (
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
                  !showPreroll && (
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
                        style={{ border: "none", backgroundColor: "#000" }}
                        onLoad={handleIframeLoad}
                        onError={handleVideoError}
                      />
                    </>
                  )
                )}

                {/* Controls */}
                {!showPlayOverlay && !showPreroll && (
                  <div className="absolute top-4 right-4 flex gap-2 z-[100000]">
                    <button
                      onClick={toggleRotation}
                      className={`p-2 rounded-full transition-all ${
                        isRotated ? "bg-cyan-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                {isRotated && (
                  <button
                    onClick={() => setIsRotated(false)}
                    className="absolute top-4 left-4 z-[100001] p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
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
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

export default ProductionVideoPlayer
