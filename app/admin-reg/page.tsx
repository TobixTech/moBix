"use client"

import type React from "react"

import Link from "next/link"
import { Mail, Lock, Key, UserPlus } from "lucide-react"
import { useState } from "react"

export default function AdminRegister() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteKey, setInviteKey] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Backend integration point
    console.log("Admin registration attempt:", { email, password, inviteKey })
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00FFFF] glow-cyan mb-2">moBix</h1>
          <p className="text-[#888888]">Admin Portal</p>
        </div>

        {/* Registration Card */}
        <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Create Admin Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-[#888888]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mobix.com"
                  className="w-full pl-10 pr-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-[#888888]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]"
                  required
                />
              </div>
            </div>

            {/* Invite Key Field */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Invite Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-5 h-5 text-[#888888]" />
                <input
                  type="text"
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value)}
                  placeholder="Enter your invite key"
                  className="w-full pl-10 pr-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#00FFFF] text-[#0B0C10] py-2 rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition mt-6"
            >
              <UserPlus className="w-5 h-5" />
              Sign Up
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-[#888888] text-sm mt-6">
            Already have an account?{" "}
            <Link href="/admin-log" className="text-[#00FFFF] hover:underline">
              Log In
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[#555555] text-xs mt-8">Admin access only. Unauthorized access is prohibited.</p>
      </div>
    </div>
  )
}
