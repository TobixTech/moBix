"use client"

import Link from "next/link"
import { Search, LogOut, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { searchMovies } from "@/lib/server-actions"
import { useAuth, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import NotificationsDropdown from "./notifications-dropdown"

interface NavbarProps {
  showAuthButtons?: boolean
  onAuthClick?: () => void
}

export default function Navbar({ showAuthButtons = false, onAuthClick }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { userId, isLoaded } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId && showAuthButtons) {
      router.push("/home")
    }
  }, [isLoaded, userId, showAuthButtons, router])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true)
        const results = await searchMovies(searchQuery)
        setSearchResults(results)
        setShowSearchResults(true)
        setIsSearching(false)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
        if (searchQuery === "") {
          setIsSearchOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchQuery])

  const handleResultClick = () => {
    setShowSearchResults(false)
    setSearchQuery("")
    setIsSearchOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const handleCloseSearch = () => {
    setSearchQuery("")
    setShowSearchResults(false)
    setIsSearchOpen(false)
  }

  const handleAuthClick = () => {
    if (userId) {
      router.push("/home")
    } else {
      window.location.href = "/auth"
    }
  }

  const navItems = [
    { name: "Home", href: showAuthButtons ? "/" : "/home" },
    { name: "Movies", href: "/home" },
    { name: "Series", href: "/series" },
    { name: "Watchlist", href: "/watchlist" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  return (
    <motion.nav
      className="fixed top-0 w-full bg-[#0B0C10]/95 backdrop-blur border-b border-[#2A2B33] z-50 pb-safe"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="px-4 md:px-8 py-1.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={showAuthButtons ? "/" : "/home"} className="flex-shrink-0">
          <motion.img
            src="https://tobixtech.publit.io/file/20251130-013606-h.png"
            alt="moBix"
            className="h-8 w-auto"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        </Link>

        {/* Menu */}
        <div className="hidden md:flex gap-6 flex-1 ml-8">
          {navItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={item.href} className="text-white hover:text-[#00FFFF] transition relative group text-xs">
                {item.name}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#00FFFF]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
          {!showAuthButtons && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Link href="/profile" className="text-white hover:text-[#00FFFF] transition relative group text-xs">
                Profile
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#00FFFF]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <motion.div
          ref={searchRef}
          className="relative flex items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {isSearchOpen ? (
              <motion.div
                key="search-input"
                className="flex items-center gap-2"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "280px", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    autoFocus
                    className="w-full px-4 py-1.5 bg-[#1A1B23] border border-[#2A2B33] rounded text-white text-sm placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] transition"
                  />
                  <button
                    onClick={handleCloseSearch}
                    className="absolute right-3 top-2 text-[#888888] hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showSearchResults && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto z-[60]"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSearching ? (
                          <div className="p-4 text-center text-[#888888]">
                            <div className="w-6 h-6 border-2 border-[#00FFFF]/20 border-t-[#00FFFF] rounded-full animate-spin mx-auto" />
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="py-2">
                            {searchResults.map((movie) => (
                              <Link
                                key={movie.id}
                                href={`/movie/${movie.slug || movie.id}`}
                                onClick={handleResultClick}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#2A2B33] transition-colors"
                              >
                                <img
                                  src={movie.posterUrl || "/placeholder.svg"}
                                  alt={movie.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{movie.title}</h4>
                                  <p className="text-[#888888] text-xs">
                                    {movie.year} • {movie.genre}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-[#888888] text-sm">
                            No results found for "{searchQuery}"
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="search-icon"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-[#1A1B23] rounded transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Search className="w-4 h-4" style={{ color: "#00FFFF" }} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {showAuthButtons ? (
            <>
              <motion.button
                onClick={handleAuthClick}
                className="px-3 py-1.5 font-semibold transition text-sm"
                style={{ color: "#00FFFF" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button
                onClick={handleAuthClick}
                className="px-3 py-1.5 font-bold rounded hover:shadow-lg transition text-sm"
                style={{ backgroundColor: "#00FFFF", color: "#0B0C10" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </>
          ) : (
            <>
              <NotificationsDropdown />

              <motion.button
                onClick={handleSignOut}
                className="p-2 hover:bg-[#1A1B23] rounded transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4 text-[#888888] hover:text-[#00FFFF]" />
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </motion.nav>
  )
}
