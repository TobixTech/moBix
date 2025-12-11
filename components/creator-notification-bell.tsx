"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { markCreatorNotificationRead, markAllCreatorNotificationsRead } from "@/lib/creator-actions"

interface CreatorNotificationBellProps {
  notifications: any[]
  onRefresh: () => void
}

export function CreatorNotificationBell({ notifications, onRefresh }: CreatorNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkRead = async (id: string) => {
    await markCreatorNotificationRead(id)
    onRefresh()
  }

  const handleMarkAllRead = async () => {
    await markAllCreatorNotificationsRead()
    onRefresh()
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "submission_approved":
        return "text-green-400"
      case "submission_rejected":
        return "text-red-400"
      case "strike_received":
        return "text-amber-400"
      default:
        return "text-[#00FFFF]"
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg text-white hover:bg-[#2A2B33] transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 md:hidden z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed left-4 right-4 top-20 md:absolute md:right-0 md:left-auto md:top-full md:mt-2 md:w-80 bg-[#1A1B23] border border-[#2A2B33] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[70vh] md:max-h-96">
            <div className="flex items-center justify-between p-4 border-b border-[#2A2B33]">
              <h3 className="text-white font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[#00FFFF] text-sm hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-60px)] md:max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/50">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-[#2A2B33] hover:bg-[#2A2B33]/50 transition ${
                      !notif.isRead ? "bg-[#00FFFF]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.isRead ? "bg-[#00FFFF]" : "bg-transparent"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${getNotificationColor(notif.type)}`}>{notif.title}</p>
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-white/40 text-xs mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="p-1 text-white/50 hover:text-white hover:bg-[#2A2B33] rounded transition shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 10 && (
              <div className="p-3 border-t border-[#2A2B33] text-center">
                <span className="text-white/50 text-sm">Showing 10 of {notifications.length}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
