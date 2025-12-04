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
      className="fixed bottom-3 left-3 right-3 z-50 md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className="bg-[#1A1B23]/95 backdrop-blur-xl border border-[#2A2B33]/50 rounded-2xl shadow-2xl shadow-black/50"
        style={{
          boxShadow:
            "0 -4px 30px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-[#00FFFF]/20 shadow-lg shadow-[#00FFFF]/20" : "bg-transparent hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? "text-[#00FFFF]" : "text-[#666666]"
                    }`}
                    style={
                      isActive
                        ? {
                            color: "#00FFFF",
                            filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.5))",
                          }
                        : {}
                    }
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    isActive ? "text-[#00FFFF]" : "text-[#666666]"
                  }`}
                  style={isActive ? { color: "#00FFFF" } : {}}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
