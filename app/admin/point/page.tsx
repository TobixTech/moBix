"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { LayoutDashboard, Database, ArrowRight } from "lucide-react"

export default function AdminPointPage() {
  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <motion.div
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Admin Dashboard Card */}
        <Link href="/admin/dashboard" className="group">
          <motion.div
            className="h-full bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8 hover:border-[#00FFFF] hover:shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <LayoutDashboard className="w-32 h-32 text-[#00FFFF]" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 bg-[#00FFFF]/10 rounded-xl flex items-center justify-center mb-6 text-[#00FFFF]">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-[#00FFFF] transition-colors">
                  Dashboard
                </h2>
                <p className="text-[#888888] leading-relaxed">
                  Manage movies, users, comments, and site settings. View analytics and handle user feedback.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-[#00FFFF] font-semibold group-hover:translate-x-2 transition-transform">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Seed Database Card */}
        <Link href="/admin/seed" className="group">
          <motion.div
            className="h-full bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8 hover:border-[#00FFFF] hover:shadow-[0_0_30px_rgba(0,255,255,0.1)] transition-all relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="w-32 h-32 text-[#00FFFF]" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 bg-[#00FFFF]/10 rounded-xl flex items-center justify-center mb-6 text-[#00FFFF]">
                  <Database className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-[#00FFFF] transition-colors">
                  Seed Database
                </h2>
                <p className="text-[#888888] leading-relaxed">
                  Initialize or reset the database with sample movies and default configurations.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-[#00FFFF] font-semibold group-hover:translate-x-2 transition-transform">
                Go to Seed Page <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  )
}
