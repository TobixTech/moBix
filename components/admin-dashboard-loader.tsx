"use client"

import { useEffect, useState } from "react"

export function AdminDashboardLoader() {
  const [dots, setDots] = useState([false, false, false, false, false])
  const [textIndex, setTextIndex] = useState(0)
  const text = "moBix"

  useEffect(() => {
    // Bubble dots animation
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        const newDots = [...prev]
        const activeIndex = prev.findIndex((d) => d)
        if (activeIndex === -1) {
          newDots[0] = true
        } else if (activeIndex === prev.length - 1) {
          newDots.fill(false)
          newDots[0] = true
        } else {
          newDots[activeIndex] = false
          newDots[activeIndex + 1] = true
        }
        return newDots
      })
    }, 200)

    // Snake text animation
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % (text.length + 1))
    }, 150)

    return () => {
      clearInterval(dotInterval)
      clearInterval(textInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1018] to-[#0B0C10] flex items-center justify-center">
      <div className="text-center">
        {/* Bubble dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {dots.map((active, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                active ? "bg-cyan-400 scale-150 shadow-lg shadow-cyan-400/50" : "bg-white/20 scale-100"
              }`}
            />
          ))}
        </div>

        {/* Snake text animation */}
        <div className="text-3xl font-bold tracking-wider">
          {text.split("").map((char, i) => (
            <span
              key={i}
              className={`inline-block transition-all duration-200 ${
                i < textIndex
                  ? "text-cyan-400 transform translate-y-0 opacity-100"
                  : "text-white/20 transform translate-y-2 opacity-50"
              }`}
              style={{
                textShadow: i < textIndex ? "0 0 20px rgba(0, 255, 255, 0.5)" : "none",
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Loading text */}
        <p className="text-white/40 text-sm mt-4 animate-pulse">Loading admin panel...</p>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
