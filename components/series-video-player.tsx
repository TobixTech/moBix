"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Play, RotateCw, X, Maximize2, Minimize2, RefreshCw, AlertTriangle } from "lucide-react"
import MobixVideoLoader from "./mobix-video-loader"

interface SeriesVideoPlayerProps {
  videoUrl: string
  posterUrl: string
  title: string
  episodeTitle?: string
  onError?: () => void
  isPremium?: boolean
  prerollAdCodes?: { name: string; code: string }[]
  showPrerollAds?: boolean
  skipDelay?: number
  adTimeout?: number
}

function isYouTubeUrl(url: string): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be") || lowerUrl.includes("youtube-nocookie.com")
}

function isEmbedUrl(url: string): boolean {
  if (!url) return false
  const embedPatterns = [
    "youtube.com",
    "youtu.be",
    "vimeo.com",
    "dailymotion.com",
    "dai.ly",
    "drive.google.com",
    "streamtape",
    "strtape",
    "strcloud",
    "stape.fun",
    "doodstream",
    "dood.watch",
    "dood.to",
    "dood.so",
    "dood.pm",
    "dood.wf",
    "filemoon",
    "vidoza",
    "upstream",
    "mixdrop",
    "mp4upload",
    "streamsb",
    "sbembed",
    "sbvideo",
    "sbplay",
    "embedsb",
    "streamwish",
    "wishfast",
    "sfastwish",
    "swdyu",
    "vidhide",
    "vtube",
    "vtbe",
    "vidcloud",
    "vidstream",
    "vidmoly",
    "voe.sx",
    "fembed",
    "fcdn.stream",
    "ok.ru",
    "rutube.ru",
    "embed",
    "iframe",
    "/e/",
    "/v/",
    "player",
  ]
  const lowerUrl = url.toLowerCase()
  return embedPatterns.some((pattern) => lowerUrl.includes(pattern))
}

function getEmbedUrl(url: string): string {
  if (!url) return ""
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes("youtube.com/watch")) {
    try {
      const videoId = new URL(url).searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    } catch {
      return url
    }
  }
  if (lowerUrl.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0]
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
  }
  if (lowerUrl.includes("youtube.com/embed")) {
    if (!url.includes("autoplay")) {
      return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`
    }
    return url
  }

  if (lowerUrl.includes("vimeo.com/") && !lowerUrl.includes("player.vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0]
    if (videoId) return `https://player.vimeo.com/video/${videoId}?autoplay=1`
  }

  if (lowerUrl.includes("dailymotion.com/video/")) {
    const videoId = url.split("/video/")[1]?.split("?")[0]?.split("_")[0]
    return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`
  }

  const streamtapeDomains = [
    "streamtape.com",
    "streamtape.to",
    "streamtape.net",
    "strtape.cloud",
    "strcloud.link",
    "strtpe.link",
    "stape.fun",
  ]
  if (streamtapeDomains.some((d) => lowerUrl.includes(d))) {
    if (url.includes("/v/")) return url.replace("/v/", "/e/")
    return url
  }

  const doodDomains = ["doodstream", "dood.watch", "dood.to", "dood.so", "dood.pm", "dood.wf", "dood.re", "dood.cx"]
  if (doodDomains.some((d) => lowerUrl.includes(d))) {
    if (url.includes("/d/")) return url.replace("/d/", "/e/")
    return url
  }

  if (lowerUrl.includes("mixdrop")) {
    if (url.includes("/f/")) return url.replace("/f/", "/e/")
    return url
  }

  if (lowerUrl.includes("drive.google.com/file/d/")) {
    const fileId = url.split("/file/d/")[1]?.split("/")[0]
    return `https://drive.google.com/file/d/${fileId}/preview`
  }

  return url
}

export default function SeriesVideoPlayer({
  videoUrl,
  posterUrl,
  title,
  episodeTitle,
  onError,
  isPremium = false,
  prerollAdCodes = [],
  showPrerollAds = true,
  skipDelay = 5,
  adTimeout = 30,
}: SeriesVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRotated, setIsRotated] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const adContainerRef = useRef<HTMLDivElement>(null)

  const [showMobixIntro, setShowMobixIntro] = useState(false)
  const [showPreroll, setShowPreroll] = useState(false)
  const [prerollCountdown, setPrerollCountdown] = useState(skipDelay)
  const [canSkipPreroll, setCanSkipPreroll] = useState(false)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  const isEmbed = isEmbedUrl(videoUrl)
  const embedUrl = getEmbedUrl(videoUrl)
  const isYouTube = isYouTubeUrl(videoUrl)

  const shouldShowAds = !isPremium && showPrerollAds && prerollAdCodes.length > 0

  const executeAdScripts = useCallback((container: HTMLDivElement, adCode: string) => {
    if (!container || !adCode) return

    container.innerHTML = ""

    const wrapper = document.createElement("div")
    wrapper.className = "w-full h-full flex items-center justify-center"

    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = adCode

    const scripts = tempDiv.querySelectorAll("script")
    const nonScriptContent = adCode.replace(/<script[\s\S]*?<\/script>/gi, "")

    wrapper.innerHTML = nonScriptContent
    container.appendChild(wrapper)

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script")

      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value)
      })

      if (oldScript.src) {
        newScript.src = oldScript.src
      } else {
        newScript.textContent = oldScript.textContent
      }

      container.appendChild(newScript)
    })
  }, [])

  useEffect(() => {
    if (showPreroll && shouldShowAds && adContainerRef.current && prerollAdCodes[currentAdIndex]) {
      executeAdScripts(adContainerRef.current, prerollAdCodes[currentAdIndex].code)
    }
  }, [showPreroll, shouldShowAds, currentAdIndex, prerollAdCodes, executeAdScripts])

  useEffect(() => {
    if (showMobixIntro) {
      const timer = setTimeout(() => {
        setShowMobixIntro(false)
        if (shouldShowAds) {
          setShowPreroll(true)
          setPrerollCountdown(skipDelay)
          setCanSkipPreroll(false)
        } else {
          setIsLoading(true)
          setIsPlaying(true)
          setHasError(false)
          setErrorMessage("")
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showMobixIntro, shouldShowAds, skipDelay])

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

  const handlePlay = useCallback(() => {
    if (!videoUrl) {
      setHasError(true)
      setErrorMessage("No video URL provided.")
      onError?.()
      return
    }
    setShowMobixIntro(true)
  }, [videoUrl, onError])

  const handleSkipPreroll = useCallback(() => {
    if (adContainerRef.current) {
      adContainerRef.current.innerHTML = ""
    }
    setShowPreroll(false)
    setIsLoading(true)
    setIsPlaying(true)
    setHasError(false)
    setErrorMessage("")
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setErrorMessage("")
    setIsPlaying(false)
    setIsLoading(false)
    setTimeout(() => handlePlay(), 100)
  }, [handlePlay])

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleIframeError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    setErrorMessage("Failed to load video. The source may be unavailable.")
    onError?.()
  }, [onError])

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
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement) setIsRotated(false)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRotated && !isFullscreen) setIsRotated(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRotated, isFullscreen])

  const containerStyles: React.CSSProperties =
    isRotated && !isFullscreen
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

  const getReferrerPolicy = (): React.HTMLAttributeReferrerPolicy => {
    return isYouTube ? "strict-origin-when-cross-origin" : "no-referrer"
  }

  return (
    <>
      {isRotated && !isFullscreen && (
        <div className="fixed inset-0 bg-black z-[99998]" onClick={() => setIsRotated(false)} />
      )}

      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#2A2B33] shadow-2xl ${
          isRotated && !isFullscreen ? "rounded-none border-0" : ""
        }`}
        style={containerStyles}
      >
        {/* moBix Intro */}
        {showMobixIntro && (
          <div className="absolute inset-0 z-[110] bg-black">
            <MobixVideoLoader />
          </div>
        )}

        {/* Preroll Ad Overlay - only for non-premium users */}
        {showPreroll && shouldShowAds && !showMobixIntro && (
          <div className="absolute inset-0 z-[100] bg-black flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              <div ref={adContainerRef} className="absolute inset-0 flex items-center justify-center" />
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              {canSkipPreroll ? (
                <button
                  onClick={handleSkipPreroll}
                  className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  Skip Ad
                </button>
              ) : (
                <div className="px-4 py-2 bg-black/80 text-white rounded-lg">Skip in {prerollCountdown}s</div>
              )}
            </div>
            <div className="absolute top-4 left-4 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">
              AD
            </div>
            {prerollAdCodes[currentAdIndex]?.name && (
              <div className="absolute top-4 right-4 bg-black/60 text-white/60 text-xs px-2 py-1 rounded">
                {prerollAdCodes[currentAdIndex].name}
              </div>
            )}
          </div>
        )}

        {isPlaying && !hasError && !showPreroll && !showMobixIntro && (
          <div className={`absolute top-3 right-3 flex items-center gap-2 ${isRotated ? "z-[100000]" : "z-50"}`}>
            <button
              onClick={handleRotate}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isRotated ? "bg-cyan-500 text-black" : "bg-black/60 text-white hover:bg-black/80"
              }`}
              title={isRotated ? "Exit rotation" : "Rotate"}
            >
              {isRotated ? <X className="w-5 h-5" /> : <RotateCw className="w-5 h-5" />}
            </button>
            <button
              onClick={handleFullscreen}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isFullscreen ? "bg-cyan-500 text-black" : "bg-black/60 text-white hover:bg-black/80"
              }`}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0C10] to-[#1A1B23]">
            <div className="text-center p-8">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
              <p className="text-white/60 mb-6 max-w-md">{errorMessage || "The video could not be loaded."}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !hasError && !showPreroll && !showMobixIntro && (
          <div className="absolute inset-0 z-30">
            <MobixVideoLoader />
          </div>
        )}

        {/* Play Button Overlay */}
        {!isPlaying && !hasError && !showPreroll && !showMobixIntro && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group"
            onClick={handlePlay}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${posterUrl || "/placeholder.svg?height=720&width=1280"})` }}
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                <Play className="w-10 h-10 text-black ml-1" fill="black" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-white font-medium text-lg">{title}</p>
                {episodeTitle && <p className="text-white/70 text-sm">{episodeTitle}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {isPlaying && !hasError && !showPreroll && !showMobixIntro && (
          <>
            {isEmbed ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy={getReferrerPolicy()}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                controls
                autoPlay
                playsInline
                onLoadedData={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true)
                  setErrorMessage("Failed to load video file.")
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

export { SeriesVideoPlayer }
