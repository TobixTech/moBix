"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, Trash2, Film, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/server-actions"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  movie: {
    id: string
    slug: string
    title: string
    posterUrl: string
  } | null
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationCount()
      setUnreadCount(count)
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        setIsLoading(true)
        const result = await getUserNotifications(20)
        setNotifications(result)
        setIsLoading(false)
      }
      fetchNotifications()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleDelete = async (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#1A1B23] rounded-full transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" style={{ color: "#00FFFF" }} />

        {/* Red dot for unread notifications */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#1A1B23] border border-[#2A2B33] rounded-xl shadow-2xl overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2B33] bg-[#0B0C10]">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#00FFFF] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#2A2B33] rounded transition">
                  <X className="w-4 h-4 text-[#888888]" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#00FFFF]/20 border-t-[#00FFFF] rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#888888]">
                  <Bell className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`relative p-4 border-b border-[#2A2B33] hover:bg-[#2A2B33]/50 transition ${
                      !notification.isRead ? "bg-[#00FFFF]/5" : ""
                    }`}
                  >
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FFFF] rounded-full" />
                    )}

                    <div className="flex gap-3 pl-3">
                      {/* Icon or Movie Poster */}
                      {notification.movie ? (
                        <Link href={`/movie/${notification.movie.slug || notification.movie.id}`}>
                          <img
                            src={notification.movie.posterUrl || "/placeholder.svg"}
                            alt={notification.movie.title}
                            className="w-12 h-16 object-cover rounded flex-shrink-0"
                          />
                        </Link>
                      ) : (
                        <div className="w-10 h-10 bg-[#2A2B33] rounded-full flex items-center justify-center flex-shrink-0">
                          <Film className="w-5 h-5 text-[#00FFFF]" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-[#888888] text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[#666666] text-[10px] mt-1">{formatTime(notification.createdAt)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 hover:bg-[#2A2B33] rounded text-[#888888] hover:text-[#00FFFF] transition"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 hover:bg-[#2A2B33] rounded text-[#888888] hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-[#2A2B33] bg-[#0B0C10]">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-[#00FFFF] hover:underline"
                >
                  View all in dashboard
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
