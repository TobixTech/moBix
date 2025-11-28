"use client"

import { useState } from "react"
import MobixIntro from "./mobix-intro"
import PrerollAdPlayer from "./preroll-ad-player"

interface ProductionVideoPlayerProps {
  videoUrl: string
  posterUrl: string
  title: string
  vastUrl?: string
  skipIntro?: boolean
  adTimeout?: number
  showPrerollAds?: boolean
  adSettings?: {
    horizontalAdCode?: string
    verticalAdCode?: string
  } | null
}

export default function ProductionVideoPlayer({
  videoUrl,
  posterUrl,
  title,
  vastUrl,
  skipIntro = false,
  adTimeout = 20,
  showPrerollAds = true,
  adSettings,
}: ProductionVideoPlayerProps) {
  const [showIntro, setShowIntro] = useState(!skipIntro)
  const [showAd, setShowAd] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const hasAdContent = adSettings?.horizontalAdCode || adSettings?.verticalAdCode

  const handleIntroComplete = () => {
    setShowIntro(false)
    if (showPrerollAds && hasAdContent) {
      setShowAd(true)
    } else {
      setShowVideo(true)
    }
  }

  const handleAdComplete = () => {
    setShowAd(false)
    setShowVideo(true)
  }

  const handleAdSkip = () => {
    setShowAd(false)
    setShowVideo(true)
  }

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
      {/* Intro Animation */}
      {showIntro && <MobixIntro onComplete={handleIntroComplete} />}

      {/* Pre-roll Ad - Now uses native banner ads */}
      {showAd && (
        <PrerollAdPlayer
          adSettings={adSettings}
          onComplete={handleAdComplete}
          onSkip={handleAdSkip}
          skipDelay={5}
          totalAds={4}
          adDuration={5}
        />
      )}

      {/* Main Video Player */}
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
