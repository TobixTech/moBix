"use client"

import { motion } from "framer-motion"

export function MobixVideoLoader() {
  const letters = ["m", "o", "B", "i", "x"]

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0C10] via-[#1A1B23] to-[#0B0C10]">
      {/* Bubble dots animation */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600"
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Snake-style moBix text */}
      <div className="flex items-center justify-center">
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            className="text-4xl md:text-5xl font-black"
            style={{
              color: letter === "B" ? "#00FFFF" : "#FFFFFF",
              textShadow: letter === "B" ? "0 0 20px rgba(0,255,255,0.5)" : "none",
            }}
            initial={{ opacity: 0, x: -20, rotateY: -90 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [-20, 0, 0, 20],
              rotateY: [-90, 0, 0, 90],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.2,
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Loading text */}
      <motion.p
        className="mt-6 text-white/50 text-sm tracking-widest"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      >
        LOADING VIDEO...
      </motion.p>

      {/* Progress bar */}
      <div className="mt-4 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

export default MobixVideoLoader
