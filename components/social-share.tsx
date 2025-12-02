"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share2, X, Copy, Check, Facebook, MessageCircle } from "lucide-react"

interface SocialShareProps {
  title: string
  url: string
  description?: string
  posterUrl?: string
}

export default function SocialShare({ title, url, description, posterUrl }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url

  const shareText = `Check out "${title}" on moBix! ${description ? description.slice(0, 100) + "..." : ""}`

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Twitter/X",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "#000000",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: "Telegram",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      color: "#0088cc",
      url: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Reddit",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      color: "#FF4500",
      url: `https://reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
    },
    {
      name: "Email",
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
      color: "#EA4335",
      url: `mailto:?subject=${encodeURIComponent(`Watch ${title} on moBix`)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
    },
  ]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: fullUrl,
        })
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setIsOpen(true)
        }
      }
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-6 py-3 rounded-lg border bg-[#1A1B23] text-white border-[#2A2B33] hover:border-[#00FFFF] hover:bg-[#00FFFF]/10 transition-all"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-6 z-50"
              initial={{ opacity: 0, scale: 0.9, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, y: "-40%" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Share "{title}"</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Share Links Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {shareLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0B0C10] hover:bg-[#2A2B33] transition-colors group"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${link.color}20` }}
                      >
                        <span style={{ color: link.color }}>
                          {typeof Icon === "function" ? <Icon /> : <Icon className="w-5 h-5" />}
                        </span>
                      </div>
                      <span className="text-xs text-[#888888] group-hover:text-white transition-colors">
                        {link.name}
                      </span>
                    </a>
                  )
                })}
              </div>

              {/* Copy Link */}
              <div className="flex items-center gap-2 p-3 bg-[#0B0C10] rounded-lg border border-[#2A2B33]">
                <input
                  type="text"
                  value={fullUrl}
                  readOnly
                  className="flex-1 bg-transparent text-white text-sm outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    copied ? "bg-green-500/20 text-green-400" : "bg-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF]/30"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
