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

  // YouTube
  if (lowerUrl.includes("youtube.com/watch")) {
    try {
      const videoId = new URL(url).searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`
    } catch {
      return url
    }
  }
  if (lowerUrl.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0]
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`
  }
  if (lowerUrl.includes("youtube.com/embed")) {
    return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`
  }

  // Vimeo
  if (lowerUrl.includes("vimeo.com/") && !lowerUrl.includes("player.vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0]
    if (videoId) return `https://player.vimeo.com/video/${videoId}?autoplay=1`
  }

  // Dailymotion
  if (lowerUrl.includes("dailymotion.com/video/")) {
    const videoId = url.split("/video/")[1]?.split("?")[0]?.split("_")[0]
    return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`
  }

  // Streamtape
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

  // Doodstream
  const doodDomains = ["doodstream", "dood.watch", "dood.to", "dood.so", "dood.pm", "dood.wf", "dood.re", "dood.cx"]
  if (doodDomains.some((d) => lowerUrl.includes(d))) {
    if (url.includes("/d/")) return url.replace("/d/", "/e/")
    return url
  }

  // Mixdrop
  if (lowerUrl.includes("mixdrop")) {
    if (url.includes("/f/")) return url.replace("/f/", "/e/")
    return url
  }

  // Google Drive
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

  const isEmbed = isEmbedUrl(videoUrl)
  const embedUrl = getEmbedUrl(videoUrl)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === "string" && event.data.includes("youtube")) {
          const data = JSON.parse(event.data)
          if (data.event === "onError" || data.info?.errorCode) {
            const errorCode = data.info?.errorCode || data.errorCode
            if (errorCode === 150 || errorCode === 101 || errorCode === 153) {
              setHasError(true)
              setErrorMessage("This video cannot be embedded. The owner has restricted playback.")
            }
          }
        }
      } catch {}
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const handlePlay = useCallback(() => {
    if (!videoUrl) {
      setHasError(true)
      setErrorMessage("No video URL provided.")
      onError?.()
      return
    }
    setIsLoading(true)
    setIsPlaying(true)
    setHasError(false)
    setErrorMessage("")
  }, [videoUrl, onError])

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
          transform: "rotate(90deg) translateY(-100%)",
          transformOrigin: "top left",
          zIndex: 99999,
          backgroundColor: "#000",
        }
      : {}

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
        {isPlaying && !hasError && (
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                {errorMessage || "This video cannot be played. The source may be unavailable or restricted."}
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {isLoading && !hasError && <MobixVideoLoader />}

        {/* Play Button Overlay */}
        {!isPlaying && !hasError && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group"
            onClick={handlePlay}
            style={{
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
            <button className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-300">
              <Play className="w-10 h-10 md:w-12 md:h-12 text-black fill-black ml-1" />
            </button>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white text-lg font-semibold drop-shadow-lg">{title}</p>
              {episodeTitle && <p className="text-gray-300 text-sm">{episodeTitle}</p>}
            </div>
          </div>
        )}

        {/* Video Content */}
        {isPlaying && !hasError && (
          <>
            {isEmbed ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                referrerPolicy="no-referrer"
                loading="eager"
                style={{ border: "none", backgroundColor: "#000" }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                style={{ backgroundColor: "#000" }}
                onLoadedData={() => setIsLoading(false)}
                onError={handleIframeError}
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
