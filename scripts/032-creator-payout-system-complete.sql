-- Creator Payout & Offer System - Complete Database Schema
-- Phases 1-6: All tables for wallet management, payouts, tiers, offers, analytics, and security

-- ============================================
-- PHASE 1: WALLET MANAGEMENT & EARNINGS TRACKING
-- ============================================

-- Creator Wallets (one wallet per creator)
CREATE TABLE IF NOT EXISTS "CreatorWallet" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "cryptoType" TEXT NOT NULL CHECK ("cryptoType" IN ('SOL', 'TRC20', 'BEP20')),
  "walletAddress" TEXT NOT NULL,
  "changeHistory" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastChangedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "canChangeAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '21 days') NOT NULL
);

-- Withdrawal PINs (security for withdrawals)
CREATE TABLE IF NOT EXISTS "CreatorWithdrawalPin" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "pinHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastChangedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Creator Earnings Tracking (weekly calculations)
CREATE TABLE IF NOT EXISTS "CreatorEarning" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "contentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL CHECK ("contentType" IN ('movie', 'series')),
  "date" DATE NOT NULL,
  "views" INTEGER DEFAULT 0 NOT NULL,
  "earningsUsd" DECIMAL(10, 4) DEFAULT 0 NOT NULL,
  "tierRate" DECIMAL(10, 6) DEFAULT 0 NOT NULL,
  "bonusMultiplier" DECIMAL(4, 2) DEFAULT 1.00 NOT NULL,
  "isPaid" BOOLEAN DEFAULT false NOT NULL,
  "calculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "weekNumber" INTEGER NOT NULL
);

-- Creator Tier Status
CREATE TABLE IF NOT EXISTS "CreatorTier" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "tierLevel" TEXT DEFAULT 'bronze' NOT NULL CHECK ("tierLevel" IN ('bronze', 'silver', 'gold', 'platinum')),
  "totalViews" INTEGER DEFAULT 0 NOT NULL,
  "ratePerView" DECIMAL(10, 6) DEFAULT 0.0008 NOT NULL,
  "requestedTier" TEXT CHECK ("requestedTier" IN ('bronze', 'silver', 'gold', 'platinum')),
  "requestedAt" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "approvedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "upgradedAt" TIMESTAMP
);

-- Creator Settings
CREATE TABLE IF NOT EXISTS "CreatorSetting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "monthlyWithdrawalLimit" DECIMAL(10, 2) DEFAULT 100.00 NOT NULL,
  "holdingPeriodDays" INTEGER DEFAULT 7 NOT NULL,
  "canWithdraw" BOOLEAN DEFAULT true NOT NULL,
  "isPremium" BOOLEAN DEFAULT false NOT NULL,
  "pausedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "pausedReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- PHASE 2: WITHDRAWAL & PAYOUT SYSTEM
-- ============================================

-- Payout Requests
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "amountUsd" DECIMAL(10, 2) NOT NULL,
  "cryptoType" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'approved', 'rejected', 'completed')),
  "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "processedAt" TIMESTAMP,
  "processedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "adminNote" TEXT,
  "transactionHash" TEXT,
  "rejectionReason" TEXT,
  "feePercentage" DECIMAL(4, 2) DEFAULT 2.00 NOT NULL,
  "feeAmount" DECIMAL(10, 2) NOT NULL,
  "netAmount" DECIMAL(10, 2) NOT NULL
);

-- Payout Transactions
CREATE TABLE IF NOT EXISTS "PayoutTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "payoutRequestId" TEXT NOT NULL REFERENCES "PayoutRequest"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "amountUsd" DECIMAL(10, 2) NOT NULL,
  "cryptoCurrency" TEXT NOT NULL,
  "cryptoAmount" DECIMAL(20, 8) NOT NULL,
  "exchangeRate" DECIMAL(20, 8) NOT NULL,
  "transactionHash" TEXT,
  "feeAmount" DECIMAL(10, 2) NOT NULL,
  "status" TEXT DEFAULT 'completed' NOT NULL,
  "processedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Withdrawal Cooldowns
CREATE TABLE IF NOT EXISTS "WithdrawalCooldown" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "lastWithdrawalAt" TIMESTAMP NOT NULL,
  "nextEligibleAt" TIMESTAMP NOT NULL,
  "monthlyTotal" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  "monthlyLimit" DECIMAL(10, 2) NOT NULL,
  "monthStart" DATE NOT NULL
);

-- ============================================
-- PHASE 4: OFFER & PROMOTION SYSTEM
-- ============================================

-- Creator Offers
CREATE TABLE IF NOT EXISTS "CreatorOffer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "offerType" TEXT NOT NULL CHECK ("offerType" IN ('welcome', 'challenge', 'seasonal', 'quality', 'custom')),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "bonusAmount" DECIMAL(10, 2),
  "multiplier" DECIMAL(4, 2),
  "conditions" JSONB,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Offer Redemptions
CREATE TABLE IF NOT EXISTS "CreatorOfferRedemption" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "offerId" TEXT NOT NULL REFERENCES "CreatorOffer"("id") ON DELETE CASCADE,
  "progress" JSONB DEFAULT '{}'::jsonb,
  "isCompleted" BOOLEAN DEFAULT false NOT NULL,
  "bonusApplied" DECIMAL(10, 2) DEFAULT 0,
  "redeemedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("userId", "offerId")
);

-- Creator Bonuses Log
CREATE TABLE IF NOT EXISTS "CreatorBonus" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bonusType" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "reason" TEXT NOT NULL,
  "appliedBy" TEXT,
  "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- PHASE 5: ADVANCED ANALYTICS & REPORTING
-- ============================================

-- Creator View Analytics
CREATE TABLE IF NOT EXISTS "CreatorViewAnalytics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "contentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "viewedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "country" TEXT,
  "city" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "referrer" TEXT,
  "sessionId" TEXT
);

-- ============================================
-- PHASE 6: SECURITY & FRAUD DETECTION
-- ============================================

-- Creator Content Hash
CREATE TABLE IF NOT EXISTS "CreatorContentHash" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentId" TEXT NOT NULL UNIQUE,
  "contentType" TEXT NOT NULL,
  "fileHash" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Creator IP Log
CREATE TABLE IF NOT EXISTS "CreatorIpLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "ipAddress" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "isSuspicious" BOOLEAN DEFAULT FALSE
);

-- Creator Fraud Flags
CREATE TABLE IF NOT EXISTS "CreatorFraudFlag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "flagType" TEXT NOT NULL,
  "severity" TEXT NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "description" TEXT NOT NULL,
  "evidence" TEXT,
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'investigating', 'resolved', 'confirmed')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "resolvedBy" TEXT REFERENCES "User"("id"),
  "actionTaken" TEXT
);

-- Creator Chargebacks
CREATE TABLE IF NOT EXISTS "CreatorChargeback" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "payoutRequestId" TEXT NOT NULL REFERENCES "PayoutRequest"("id"),
  "amountUsd" DECIMAL(10, 2) NOT NULL,
  "reason" TEXT NOT NULL,
  "initiatedBy" TEXT NOT NULL REFERENCES "User"("id"),
  "initiatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'completed', 'failed')),
  "completedAt" TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_creator_wallet_user" ON "CreatorWallet"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_user" ON "CreatorEarning"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_date" ON "CreatorEarning"("date");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_content" ON "CreatorEarning"("contentId");
CREATE INDEX IF NOT EXISTS "idx_creator_tier_user" ON "CreatorTier"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_setting_user" ON "CreatorSetting"("userId");
CREATE INDEX IF NOT EXISTS "idx_payout_request_user" ON "PayoutRequest"("userId");
CREATE INDEX IF NOT EXISTS "idx_payout_request_status" ON "PayoutRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_payout_transaction_user" ON "PayoutTransaction"("userId");
CREATE INDEX IF NOT EXISTS "idx_withdrawal_cooldown_user" ON "WithdrawalCooldown"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_offer_active" ON "CreatorOffer"("isActive");
CREATE INDEX IF NOT EXISTS "idx_creator_offer_redemption_user" ON "CreatorOfferRedemption"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_bonus_user" ON "CreatorBonus"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_view_analytics_user" ON "CreatorViewAnalytics"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_view_analytics_content" ON "CreatorViewAnalytics"("contentId");
CREATE INDEX IF NOT EXISTS "idx_creator_view_analytics_date" ON "CreatorViewAnalytics"("viewedAt");
CREATE INDEX IF NOT EXISTS "idx_creator_content_hash_file" ON "CreatorContentHash"("fileHash");
CREATE INDEX IF NOT EXISTS "idx_creator_content_hash_user" ON "CreatorContentHash"("uploadedBy");
CREATE INDEX IF NOT EXISTS "idx_creator_ip_log_user" ON "CreatorIpLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_ip_log_ip" ON "CreatorIpLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "idx_creator_ip_log_timestamp" ON "CreatorIpLog"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_creator_fraud_flag_user" ON "CreatorFraudFlag"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_fraud_flag_status" ON "CreatorFraudFlag"("status");
CREATE INDEX IF NOT EXISTS "idx_creator_chargeback_user" ON "CreatorChargeback"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_chargeback_payout" ON "CreatorChargeback"("payoutRequestId");

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "CreatorWallet" IS 'Stores crypto wallet addresses for creator payouts';
COMMENT ON TABLE "CreatorWithdrawalPin" IS 'Stores hashed PINs for withdrawal security';
COMMENT ON TABLE "CreatorEarning" IS 'Tracks daily earnings per content piece';
COMMENT ON TABLE "CreatorTier" IS 'Manages creator tier levels and rates';
COMMENT ON TABLE "CreatorSetting" IS 'Creator-specific payout settings and limits';
COMMENT ON TABLE "PayoutRequest" IS 'Creator withdrawal requests pending admin approval';
COMMENT ON TABLE "PayoutTransaction" IS 'Completed payout transactions with blockchain hashes';
COMMENT ON TABLE "WithdrawalCooldown" IS 'Tracks withdrawal frequency and monthly limits';
COMMENT ON TABLE "CreatorOffer" IS 'Promotional offers and bonuses for creators';
COMMENT ON TABLE "CreatorOfferRedemption" IS 'Tracks creator progress on offers';
COMMENT ON TABLE "CreatorBonus" IS 'Log of all bonuses applied to creators';
COMMENT ON TABLE "CreatorViewAnalytics" IS 'Detailed view analytics for creator content';
COMMENT ON TABLE "CreatorContentHash" IS 'File hashes for duplicate content detection';
COMMENT ON TABLE "CreatorIpLog" IS 'IP activity logs for security monitoring';
COMMENT ON TABLE "CreatorFraudFlag" IS 'Fraud alerts and investigations';
COMMENT ON TABLE "CreatorChargeback" IS 'Reversed payouts and chargebacks';
