"use client"

import { useState, createContext, useContext } from "react"
import AuthModal from "./auth-modal"

const AuthModalContext = createContext<{
  openAuthModal: () => void
  closeAuthModal: () => void
} | null>(null)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalWrapper")
  }
  return context
}

export default function AuthModalWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const openAuthModal = () => setIsAuthModalOpen(true)
  const closeAuthModal = () => setIsAuthModalOpen(false)

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  )
}
