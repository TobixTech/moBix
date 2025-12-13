-- Creator Payout System - Phase 1: Wallet Management & Earnings Tracking
-- This script adds all necessary tables for the creator payout system

-- Creator Wallets (one wallet per creator)
CREATE TABLE IF NOT EXISTS "CreatorWallet" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "cryptoType" TEXT NOT NULL CHECK ("cryptoType" IN ('SOL', 'TRC20', 'BEP20')),
  "walletAddress" TEXT NOT NULL,
  "isPrimary" BOOLEAN DEFAULT true NOT NULL,
  "changeHistory" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastChangedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "canChangeAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '21 days') NOT NULL,
  UNIQUE("userId")
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
  "earningsUSD" DECIMAL(10, 4) DEFAULT 0 NOT NULL,
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
  "requestedAt" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "approvedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_creator_wallet_user" ON "CreatorWallet"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_user" ON "CreatorEarning"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_date" ON "CreatorEarning"("date");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_content" ON "CreatorEarning"("contentId");
CREATE INDEX IF NOT EXISTS "idx_creator_tier_user" ON "CreatorTier"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_setting_user" ON "CreatorSetting"("userId");

-- Add comment documentation
COMMENT ON TABLE "CreatorWallet" IS 'Stores crypto wallet addresses for creator payouts';
COMMENT ON TABLE "CreatorWithdrawalPin" IS 'Stores hashed PINs for withdrawal security';
COMMENT ON TABLE "CreatorEarning" IS 'Tracks daily earnings per content piece';
COMMENT ON TABLE "CreatorTier" IS 'Manages creator tier levels and rates';
COMMENT ON TABLE "CreatorSetting" IS 'Creator-specific payout settings and limits';
