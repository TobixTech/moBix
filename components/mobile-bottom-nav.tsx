"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Bookmark, User, Tv, Crown, Video, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isPremium, setIsPremium] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check premium status
        const premiumRes = await fetch("/api/user/premium-status")
        const premiumData = await premiumRes.json()
        if (premiumData.isPremium) {
          setIsPremium(true)
        }

        // Check creator status
        const creatorRes = await fetch("/api/user/creator-status")
        const creatorData = await creatorRes.json()
        if (creatorData.isCreator) {
          setIsCreator(true)
        }
      } catch (error) {
        // Silently fail
      }
    }
    checkStatus()
  }, [])

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/browse", icon: Film, label: "Movies" },
    { href: "/series", icon: Tv, label: "Series" },
    ...(isCreator ? [{ href: "/creator", icon: Video, label: "Creator", isCreatorTab: true }] : []),
    { href: "/watchlist", icon: Bookmark, label: "List" },
    { href: "/dashboard", icon: isPremium ? Crown : User, label: "Me", isPremiumTab: true },
  ]

  // Don't show on landing page or auth pages
  if (pathname === "/" || pathname === "/auth" || pathname.startsWith("/admin")) {
    return null
  }

  return (
    <motion.nav
      className="fixed bottom-3 left-3 right-3 z-50 md:hidden safe-area-bottom"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className="bg-[#15161C]/98 backdrop-blur-2xl border border-[#00FFFF]/10 rounded-2xl overflow-hidden"
        style={{
          boxShadow: `
            0 0 0 1px rgba(0, 255, 255, 0.05),
            0 4px 20px rgba(0, 0, 0, 0.5),
            0 8px 40px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(0, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#00FFFF]/30 to-transparent" />

        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href))
            const Icon = item.icon
            const isPremiumMe = item.isPremiumTab && isPremium
            const isCreatorItem = item.isCreatorTab

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-300 relative min-w-[60px]"
              >
                {/* Active indicator glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: isPremiumMe
                        ? "radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, rgba(0, 255, 255, 0.1) 50%, transparent 70%)"
                        : isCreatorItem
                          ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.2) 0%, rgba(0, 255, 255, 0.1) 50%, transparent 70%)"
                          : "radial-gradient(ellipse at center, rgba(0, 255, 255, 0.15) 0%, transparent 70%)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`relative p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? isPremiumMe
                        ? "bg-gradient-to-br from-[#FFD700]/20 to-[#00FFFF]/20"
                        : isCreatorItem
                          ? "bg-purple-500/15"
                          : "bg-[#00FFFF]/15"
                      : "bg-transparent hover:bg-white/5"
                  }`}
                  style={
                    isActive
                      ? {
                          boxShadow: isPremiumMe
                            ? "0 0 15px rgba(255, 215, 0, 0.4), 0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 8px rgba(255, 215, 0, 0.2)"
                            : isCreatorItem
                              ? "0 0 15px rgba(168, 85, 247, 0.4), inset 0 0 8px rgba(168, 85, 247, 0.2)"
                              : "0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 8px rgba(0, 255, 255, 0.1)",
                        }
                      : isPremiumMe
                        ? { boxShadow: "0 0 8px rgba(255, 215, 0, 0.2)" }
                        : {}
                  }
                >
                  <Icon
                    className={`w-4 h-4 transition-all duration-300 ${
                      isPremiumMe
                        ? isActive
                          ? "text-[#FFD700]"
                          : "text-[#FFD700]/70"
                        : isCreatorItem
                          ? isActive
                            ? "text-purple-400"
                            : "text-purple-400/70"
                          : isActive
                            ? "text-[#00FFFF]"
                            : "text-[#666666]"
                    }`}
                    style={
                      isActive || isPremiumMe || isCreatorItem
                        ? {
                            filter: isPremiumMe
                              ? "drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))"
                              : isCreatorItem
                                ? "drop-shadow(0 0 6px rgba(168, 85, 247, 0.8))"
                                : "drop-shadow(0 0 6px rgba(0, 255, 255, 0.6))",
                          }
                        : {}
                    }
                  />
                </motion.div>

                <span
                  className={`text-[9px] font-semibold transition-all duration-300 ${
                    isPremiumMe
                      ? isActive
                        ? "text-[#FFD700]"
                        : "text-[#FFD700]/70"
                      : isCreatorItem
                        ? isActive
                          ? "text-purple-400"
                          : "text-purple-400/70"
                        : isActive
                          ? "text-[#00FFFF]"
                          : "text-[#555555]"
                  }`}
                  style={
                    isActive || isPremiumMe || isCreatorItem
                      ? {
                          textShadow: isPremiumMe
                            ? "0 0 8px rgba(255, 215, 0, 0.6)"
                            : isCreatorItem
                              ? "0 0 8px rgba(168, 85, 247, 0.6)"
                              : "0 0 8px rgba(0, 255, 255, 0.5)",
                        }
                      : {}
                  }
                >
                  {isPremiumMe ? "Premium" : item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${
                      isPremiumMe ? "bg-[#FFD700]" : isCreatorItem ? "bg-purple-400" : "bg-[#00FFFF]"
                    }`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom subtle shadow */}
        <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </motion.nav>
  )
}

export default MobileBottomNav
