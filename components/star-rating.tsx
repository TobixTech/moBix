"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "xs" | "sm" | "md" | "lg"
  interactive?: boolean
  onRate?: (rating: number) => void
  showValue?: boolean
  className?: string
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRate,
  showValue = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  const textSizes = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-sm",
    lg: "text-base",
  }

  const handleClick = (value: number) => {
    if (interactive && onRate) {
      onRate(value)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const value = index + 1
        const isFilled = value <= displayRating
        const isHalf = value - 0.5 <= displayRating && value > displayRating

        return (
          <motion.button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(value)}
            onMouseEnter={() => interactive && setHoverRating(value)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-transform`}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
          >
            <Star
              className={`${sizes[size]} ${
                isFilled
                  ? "fill-[#FFD700] text-[#FFD700]"
                  : isHalf
                    ? "fill-[#FFD700]/50 text-[#FFD700]"
                    : "text-[#3A3B43]"
              }`}
            />
          </motion.button>
        )
      })}
      {showValue && <span className={`ml-0.5 text-white/70 font-medium ${textSizes[size]}`}>{rating.toFixed(1)}</span>}
    </div>
  )
}
