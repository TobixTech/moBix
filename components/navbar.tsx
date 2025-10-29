"use client"

import Link from "next/link"
import { Search, User, LogOut } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface NavbarProps {
  showAuthButtons?: boolean
  onAuthClick?: () => void
}

export default function Navbar({ showAuthButtons = false, onAuthClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <motion.nav
      className="fixed top-0 w-full bg-[#0B0C10]/95 backdrop-blur border-b border-[#2A2B33] z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={showAuthButtons ? "/" : "/home"} className="flex-shrink-0">
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] bg-clip-text text-transparent"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            moBix
          </motion.div>
        </Link>

        {/* Menu */}
        <div className="hidden md:flex gap-8 flex-1 ml-8">
          {["Home", "Movies", "Dashboard"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={item === "Home" ? (showAuthButtons ? "/" : "/home") : "/"}
                className="text-white hover:text-[#00FFFF] transition relative group"
              >
                {item}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-[#00FFFF]"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <motion.div
          className="flex-1 max-w-xs hidden sm:flex"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#1A1B23] border border-[#2A2B33] rounded text-white placeholder-[#888888] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] transition"
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-[#888888]" />
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {showAuthButtons ? (
            <>
              <motion.button
                onClick={onAuthClick}
                className="px-4 py-2 text-[#00FFFF] hover:text-[#00CCCC] font-semibold transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button
                onClick={onAuthClick}
                className="px-4 py-2 bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] text-[#0B0C10] font-bold rounded hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.button>
            </>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href="/dashboard" className="p-2 hover:bg-[#1A1B23] rounded transition">
                  <User className="w-5 h-5 text-[#00FFFF]" />
                </Link>
              </motion.div>
              <motion.button
                className="p-2 hover:bg-[#1A1B23] rounded transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-5 h-5 text-[#888888] hover:text-[#00FFFF]" />
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </motion.nav>
  )
}
