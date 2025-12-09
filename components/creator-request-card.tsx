"use client"

import { useState } from "react"
import { Clock, CheckCircle, XCircle, AlertTriangle, Sparkles, Calendar, Loader, Video, ArrowRight } from "lucide-react"
import { requestCreatorAccess } from "@/lib/creator-actions"
import { toast } from "sonner"

interface CreatorRequestCardProps {
  status: string
  rejectionReason?: string
  requestedAt?: string
  accountAgeDays: number
  minAgeDays: number
  maxAgeDays: number
  isEligible: boolean
  onRequestSubmitted: () => void
}

export function CreatorRequestCard({
  status,
  rejectionReason,
  requestedAt,
  accountAgeDays,
  minAgeDays,
  maxAgeDays,
  isEligible,
  onRequestSubmitted,
}: CreatorRequestCardProps) {
  const [loading, setLoading] = useState(false)

  const handleRequestAccess = async () => {
    setLoading(true)
    const result = await requestCreatorAccess()
    setLoading(false)

    if (result.success) {
      toast.success("Request submitted successfully!")
      onRequestSubmitted()
    } else {
      toast.error(result.error || "Failed to submit request")
    }
  }

  // Not eligible - account too young
  if (accountAgeDays < minAgeDays) {
    const daysRemaining = minAgeDays - accountAgeDays
    return (
      <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Account Too New</h2>
            <p className="text-white/60 text-sm">Creator access requirements not met</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-200 text-sm">
            Your account must be at least <strong>{minAgeDays} days old</strong> to request creator access.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0B0C10] rounded-lg">
            <span className="text-white/70">Current Account Age</span>
            <span className="text-white font-bold">{accountAgeDays} days</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0B0C10] rounded-lg">
            <span className="text-white/70">Required Account Age</span>
            <span className="text-[#00FFFF] font-bold">{minAgeDays} days</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-lg">
            <span className="text-white/70">Days Remaining</span>
            <span className="text-[#00FFFF] font-bold">{daysRemaining} days</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-white/50 mb-2">
            <span>Progress</span>
            <span>{Math.round((accountAgeDays / minAgeDays) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#0B0C10] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FFFF] to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (accountAgeDays / minAgeDays) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Pending request
  if (status === "pending") {
    return (
      <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Request Pending</h2>
            <p className="text-white/60 text-sm">Your request is being reviewed</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-200 text-sm">
            Your creator access request is currently being reviewed by our team. This usually takes 24-48 hours.
          </p>
        </div>

        {requestedAt && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Requested on {new Date(requestedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    )
  }

  // Rejected request
  if (status === "rejected") {
    return (
      <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Request Rejected</h2>
            <p className="text-white/60 text-sm">Your previous request was not approved</p>
          </div>
        </div>

        {rejectionReason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-sm font-medium mb-1">Reason:</p>
            <p className="text-red-200/80 text-sm">{rejectionReason}</p>
          </div>
        )}

        {isEligible && (
          <>
            <p className="text-white/60 text-sm mb-4">
              You can submit a new request if you believe this was a mistake or your circumstances have changed.
            </p>
            <button
              onClick={handleRequestAccess}
              disabled={loading}
              className="w-full px-6 py-3 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Request Again
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    )
  }

  // Eligible - can request
  if (isEligible) {
    return (
      <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">You're Eligible!</h2>
            <p className="text-white/60 text-sm">You can now request creator access</p>
          </div>
        </div>

        <div className="bg-[#00FFFF]/10 border border-[#00FFFF]/20 rounded-xl p-4 mb-6">
          <h3 className="text-[#00FFFF] font-bold mb-2">Creator Benefits:</h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#00FFFF]" />
              Upload movies and series to share with the community
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00FFFF]" />
              Track views and engagement on your content
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00FFFF]" />
              Get featured on the homepage for popular content
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-[#0B0C10] rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{accountAgeDays}</p>
            <p className="text-white/50 text-sm">Account Age (days)</p>
          </div>
          <div className="p-4 bg-[#0B0C10] rounded-lg text-center">
            <p className="text-2xl font-bold text-[#00FFFF]">4/day</p>
            <p className="text-white/50 text-sm">Upload Limit</p>
          </div>
        </div>

        <button
          onClick={handleRequestAccess}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#00FFFF] to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFFF]/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting Request...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Request Creator Access
            </>
          )}
        </button>
      </div>
    )
  }

  // Account too old
  return (
    <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Eligibility Window Passed</h2>
          <p className="text-white/60 text-sm">Please contact support for assistance</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <p className="text-amber-200 text-sm">
          Creator access requests are only available for accounts between {minAgeDays}-{maxAgeDays} days old. Your
          account is {accountAgeDays} days old. Please contact support if you'd like to become a creator.
        </p>
      </div>
    </div>
  )
}
