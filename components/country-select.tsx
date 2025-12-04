"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Globe } from "lucide-react"
import { COUNTRIES } from "@/lib/countries"

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function CountrySelect({
  value,
  onChange,
  className = "",
  placeholder = "Select country",
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedCountry = COUNTRIES.find((c) => c.name === value)

  const filteredCountries = COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white focus:outline-none focus:border-[#00FFFF] transition"
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <>
              <Globe className="w-5 h-5 text-[#888888]" />
              <span className="text-[#666666]">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-[#888888] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1A1B23] border border-[#2A2B33] rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#2A2B33]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-9 pr-3 py-2 bg-[#0B0C10] border border-[#2A2B33] rounded-lg text-white text-sm placeholder-[#666666] focus:outline-none focus:border-[#00FFFF]"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.name)
                  setIsOpen(false)
                  setSearch("")
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition ${
                  value === country.name ? "bg-[#00FFFF]/10 text-[#00FFFF]" : "text-white"
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
