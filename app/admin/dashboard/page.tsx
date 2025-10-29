"use client"

import type React from "react"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Upload, Settings, Trash2, Edit } from "lucide-react"

interface Movie {
  id: number
  title: string
  thumbnail: string
  videoLink: string
  uploadDate: string
}

const mockMovies: Movie[] = [
  { id: 1, title: "The Last Horizon", thumbnail: "thumb1.jpg", videoLink: "video1.mp4", uploadDate: "2024-01-15" },
  { id: 2, title: "Cosmic Adventure", thumbnail: "thumb2.jpg", videoLink: "video2.mp4", uploadDate: "2024-01-10" },
  { id: 3, title: "Silent Echo", thumbnail: "thumb3.jpg", videoLink: "video3.mp4", uploadDate: "2024-01-05" },
]

type AdminTab = "upload" | "manage" | "ads"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("upload")
  const [title, setTitle] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [videoLink, setVideoLink] = useState("")

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    // Backend integration point
    console.log("Movie upload:", { title, thumbnail, videoLink })
    setTitle("")
    setThumbnail("")
    setVideoLink("")
  }

  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <Navbar />

      <div className="pt-20 px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#888888]">Manage movies and ad placements</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#2A2B33]">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-bold transition border-b-2 ${
              activeTab === "upload"
                ? "text-[#00FFFF] border-[#00FFFF]"
                : "text-[#888888] border-transparent hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Movie
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-bold transition border-b-2 ${
              activeTab === "manage"
                ? "text-[#00FFFF] border-[#00FFFF]"
                : "text-[#888888] border-transparent hover:text-white"
            }`}
          >
            Manage Movies
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`px-6 py-3 font-bold transition border-b-2 ${
              activeTab === "ads"
                ? "text-[#00FFFF] border-[#00FFFF]"
                : "text-[#888888] border-transparent hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Ad Settings
          </button>
        </div>

        {/* Upload Movie Tab */}
        {activeTab === "upload" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Upload New Movie</h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Movie Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter movie title"
                  className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Video Link</label>
                <input
                  type="url"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#00FFFF] text-[#0B0C10] py-2 rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
              >
                <Upload className="w-5 h-5" />
                Upload Movie
              </button>
            </form>
          </div>
        )}

        {/* Manage Movies Tab */}
        {activeTab === "manage" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2B33]">
                    <th className="px-6 py-4 text-left text-white font-bold">Title</th>
                    <th className="px-6 py-4 text-left text-white font-bold">Upload Date</th>
                    <th className="px-6 py-4 text-left text-white font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMovies.map((movie) => (
                    <tr key={movie.id} className="border-b border-[#2A2B33] hover:bg-[#0B0C10] transition">
                      <td className="px-6 py-4 text-white">{movie.title}</td>
                      <td className="px-6 py-4 text-[#888888]">{movie.uploadDate}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button className="p-2 bg-[#1A1B23] hover:bg-[#2A2B33] rounded transition">
                          <Edit className="w-4 h-4 text-[#00FFFF]" />
                        </button>
                        <button className="p-2 bg-[#1A1B23] hover:bg-[#2A2B33] rounded transition">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ad Settings Tab */}
        {activeTab === "ads" && (
          <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Ad Placement Settings</h2>

            <div className="space-y-6">
              {/* Horizontal Ad */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Horizontal Ad Code (728x90)</label>
                <textarea
                  placeholder="Paste your AdSense code here..."
                  className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] resize-none"
                  rows={4}
                />
              </div>

              {/* Vertical Ad */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Vertical Ad Code (300x250)</label>
                <textarea
                  placeholder="Paste your AdSense code here..."
                  className="w-full px-4 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded text-white placeholder-[#555555] focus:outline-none focus:border-[#00FFFF] resize-none"
                  rows={4}
                />
              </div>

              {/* Placement Options */}
              <div>
                <label className="block text-white text-sm font-medium mb-4">Ad Placements</label>
                <div className="space-y-3">
                  {["Homepage Carousel", "Movie Detail Sidebar", "Movie Detail Footer", "Dashboard"].map(
                    (placement) => (
                      <label key={placement} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#00FFFF]" />
                        <span className="text-white">{placement}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <button className="w-full bg-[#00FFFF] text-[#0B0C10] py-2 rounded font-bold hover:shadow-lg hover:shadow-[#00FFFF]/50 transition">
                Save Ad Settings
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
