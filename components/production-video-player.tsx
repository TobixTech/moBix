"use client"

import { useState, useRef, useEffect } from "react"
import MobixIntro from "./mobix-intro"
import PrerollAdPlayer from "./preroll-ad-player"
import MidrollAdPlayer from "./midroll-ad-player"

interface PrerollAdCode {
  code: string
  name?: string
}

interface ProductionVideoPlayerProps {
  videoUrl: string
  posterUrl: string
  title: string
  skipIntro?: boolean
  prerollEnabled?: boolean
  midrollEnabled?: boolean
  prerollAdCodes?: PrerollAdCode[]
  midrollAdCodes?: PrerollAdCode[]
  midrollIntervalMinutes?: number
  // end change
  adTimeout?: number
  skipDelay?: number
  rotationInterval?: number
}

export default function ProductionVideoPlayer({
  videoUrl,
  posterUrl,
  title,
  skipIntro = false,
  prerollEnabled = true,
  midrollEnabled = false,
  prerollAdCodes = [],
  midrollAdCodes = [],
  midrollIntervalMinutes = 20,
  // end change
  adTimeout = 20,
  skipDelay = 10,
  rotationInterval = 5,
}: ProductionVideoPlayerProps) {
  const [showIntro, setShowIntro] = useState(!skipIntro)
  const [showPrerollAd, setShowPrerollAd] = useState(false)
  const [showMidrollAd, setShowMidrollAd] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [lastMidrollTime, setLastMidrollTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleIntroComplete = () => {
    setShowIntro(false)
    const hasPrerollAds =
      prerollEnabled && prerollAdCodes.length > 0 && prerollAdCodes.some((ad) => ad.code && ad.code.trim() !== "")
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
    if (!midrollEnabled || !showVideo || midrollAdCodes.length === 0) return

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
  // end change

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
      {/* end change */}

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
