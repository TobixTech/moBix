"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MobixIntroProps {
  onComplete: () => void
  duration?: number
}

export default function MobixIntro({ onComplete, duration = 7000 }: MobixIntroProps) {
  const [currentLetter, setCurrentLetter] = useState(0)
  const letters = ["m", "o", "B", "i", "x"]

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    const letterTimer = setInterval(() => {
      setCurrentLetter((prev) => {
        if (prev < letters.length - 1) return prev + 1
        return prev
      })
    }, 800)

    return () => {
      clearTimeout(timer)
      clearInterval(letterTimer)
    }
  }, [onComplete, duration])

  return (
    <div className="absolute inset-0 bg-[#0B0C10] z-50 flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FFFF]/5 via-transparent to-[#00FFFF]/5 animate-pulse" />
        {/* Particle effects */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00FFFF]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Logo Animation */}
      <div className="relative flex items-center justify-center space-x-2">
        {letters.map((letter, index) => (
          <AnimatePresence key={index}>
            {index <= currentLetter && (
              <motion.span
                className={`text-6xl md:text-8xl font-black ${
                  letter === "B" ? "text-[#00FFFF]" : "text-white"
                } relative`}
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                {letter}

                {/* Special effects for 'B' */}
                {letter === "B" && (
                  <>
                    {/* Ripple waves */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 border-2 border-[#00FFFF] rounded-full"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: [1, 2, 3], opacity: [0.8, 0.3, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.6,
                        }}
                      />
                    ))}

                    {/* Glowing aura */}
                    <motion.div
                      className="absolute inset-0 bg-[#00FFFF] rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />

                    {/* Particle burst */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 bg-[#00FFFF] rounded-full"
                        style={{
                          left: "50%",
                          top: "50%",
                        }}
                        animate={{
                          x: Math.cos((i * Math.PI * 2) / 12) * 60,
                          y: Math.sin((i * Math.PI * 2) / 12) * 60,
                          opacity: [1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-[#2A2B33] rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[#00FFFF] to-[#00CCCC]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      </motion.div>
    </div>
  )
}
