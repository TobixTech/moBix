"use client"

import { motion } from "framer-motion"

interface MobixButtonLoaderProps {
  text?: string
}

export function MobixButtonLoader({ text = "Loading" }: MobixButtonLoaderProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Flowing water dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-current"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Text with wave effect */}
      <span className="relative overflow-hidden">
        {text}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </span>
    </div>
  )
}

export default MobixButtonLoader
