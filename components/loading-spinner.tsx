interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
}

export default function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin`}
      />
      {message && <p className="text-white/60 mt-4 text-center">{message}</p>}
    </div>
  )
}
