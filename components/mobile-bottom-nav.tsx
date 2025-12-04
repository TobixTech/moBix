"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Bookmark, User, Search } from "lucide-react"
import { motion } from "framer-motion"

export default function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/browse", icon: Film, label: "Browse" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/watchlist", icon: Bookmark, label: "Watchlist" },
    { href: "/dashboard", icon: User, label: "Profile" },
  ]

  // Don't show on landing page or auth pages
  if (pathname === "/" || pathname === "/auth" || pathname.startsWith("/admin")) {
    return null
  }

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-[#0B0C10]/95 backdrop-blur-lg border-t border-[#2A2B33] z-50 md:hidden pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 transition-colors"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-colors ${isActive ? "bg-[#00FFFF]/20" : "bg-transparent"}`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-[#00FFFF]" : "text-[#888888]"}`}
                  style={isActive ? { color: "#00FFFF" } : {}}
                />
              </motion.div>
              <span
                className={`text-xs font-medium ${isActive ? "text-[#00FFFF]" : "text-[#888888]"}`}
                style={isActive ? { color: "#00FFFF" } : {}}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
