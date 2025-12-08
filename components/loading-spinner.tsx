"use client"

import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
}

export default function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const letters = ["m", "o", "B", "i", "x"]

  const sizeConfig = {
    sm: { text: "text-2xl", dots: "w-2 h-2", gap: "gap-1" },
    md: { text: "text-3xl", dots: "w-3 h-3", gap: "gap-2" },
    lg: { text: "text-4xl", dots: "w-4 h-4", gap: "gap-3" },
  }

  const config = sizeConfig[size]

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Bubble dots */}
      <div className={`flex items-center ${config.gap} mb-4`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`${config.dots} rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600`}
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Snake moBix text */}
      <div className="flex items-center justify-center">
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className={`${config.text} font-black`}
            style={{
              color: letter === "B" ? "#00FFFF" : "#FFFFFF",
              textShadow: letter === "B" ? "0 0 15px rgba(0,255,255,0.5)" : "none",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [10, 0, 0, -10],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {message && (
        <motion.p
          className="mt-4 text-white/50 text-sm"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}
