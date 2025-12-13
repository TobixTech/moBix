-- Comprehensive Fix for Creator and Payout System
-- This script safely adds missing columns and creates payout tables

-- Step 1: Fix CreatorProfile table - add missing strikeCount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'CreatorProfile' AND column_name = 'strikeCount') THEN
        ALTER TABLE "CreatorProfile" ADD COLUMN "strikeCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added strikeCount column to CreatorProfile';
    END IF;
END$$;

-- Step 2: Create ALL Payout System Tables

-- Creator Wallets
CREATE TABLE IF NOT EXISTS "CreatorWallet" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "cryptoType" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastChangedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "canChangeAt" TIMESTAMP NOT NULL,
    "changeHistory" JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS "idx_creator_wallet_user" ON "CreatorWallet"("userId");

-- Withdrawal PINs
CREATE TABLE IF NOT EXISTS "CreatorWithdrawalPin" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastChangedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_withdrawal_pin_user" ON "CreatorWithdrawalPin"("userId");

-- Creator Earnings (Changed "date" to "earnedAt" to avoid reserved keyword)
CREATE TABLE IF NOT EXISTS "CreatorEarning" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "contentId" TEXT,
    "contentType" TEXT,
    "earnedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "views" INTEGER NOT NULL DEFAULT 0,
    "earningsUsd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tierRate" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "bonusMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "weekNumber" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_creator_earning_user" ON "CreatorEarning"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_earned_at" ON "CreatorEarning"("earnedAt");
CREATE INDEX IF NOT EXISTS "idx_creator_earning_paid" ON "CreatorEarning"("isPaid");

-- Creator Tiers
CREATE TABLE IF NOT EXISTS "CreatorTier" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "tierLevel" TEXT NOT NULL DEFAULT 'bronze',
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "ratePerView" DECIMAL(10,6) NOT NULL DEFAULT 0.0008,
    "requestedAt" TIMESTAMP,
    "approvedAt" TIMESTAMP,
    "approvedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_creator_tier_user" ON "CreatorTier"("userId");
CREATE INDEX IF NOT EXISTS "idx_creator_tier_level" ON "CreatorTier"("tierLevel");

-- Creator Payout Settings (per creator)
CREATE TABLE IF NOT EXISTS "CreatorPayoutSettings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "monthlyWithdrawalLimit" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "holdingPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "canWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "pausedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "pausedReason" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_creator_payout_settings_user" ON "CreatorPayoutSettings"("userId");

-- Payout Requests
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "cryptoType" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "processedAt" TIMESTAMP,
    "processedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "adminNote" TEXT,
    "transactionHash" TEXT,
    "rejectionReason" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_payout_request_user" ON "PayoutRequest"("userId");
CREATE INDEX IF NOT EXISTS "idx_payout_request_status" ON "PayoutRequest"("status");

-- Payout Transactions
CREATE TABLE IF NOT EXISTS "PayoutTransaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "payoutRequestId" TEXT NOT NULL REFERENCES "PayoutRequest"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "cryptoCurrency" TEXT NOT NULL,
    "cryptoAmount" DECIMAL(18,8) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "transactionHash" TEXT,
    "feeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_payout_transaction_request" ON "PayoutTransaction"("payoutRequestId");
CREATE INDEX IF NOT EXISTS "idx_payout_transaction_user" ON "PayoutTransaction"("userId");

-- Creator Offers
CREATE TABLE IF NOT EXISTS "CreatorOffer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "offerType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bonusAmount" DECIMAL(10,2),
    "multiplier" DECIMAL(3,2),
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_creator_offer_active" ON "CreatorOffer"("isActive");
CREATE INDEX IF NOT EXISTS "idx_creator_offer_expires" ON "CreatorOffer"("expiresAt");

-- Offer Redemptions
CREATE TABLE IF NOT EXISTS "CreatorOfferRedemption" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "offerId" TEXT NOT NULL REFERENCES "CreatorOffer"("id") ON DELETE CASCADE,
    "progress" JSONB,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "bonusApplied" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_offer_redemption_user" ON "CreatorOfferRedemption"("userId");
CREATE INDEX IF NOT EXISTS "idx_offer_redemption_offer" ON "CreatorOfferRedemption"("offerId");

-- Creator Bonuses
CREATE TABLE IF NOT EXISTS "CreatorBonus" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "bonusType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_creator_bonus_user" ON "CreatorBonus"("userId");

-- View Analytics (Changed "date" to "viewedAt" to avoid reserved keyword)
CREATE TABLE IF NOT EXISTS "CreatorViewAnalytics" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "contentId" TEXT,
    "viewedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "country" TEXT,
    "device" TEXT,
    "viewSource" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "idx_view_analytics_user" ON "CreatorViewAnalytics"("userId");
CREATE INDEX IF NOT EXISTS "idx_view_analytics_viewed_at" ON "CreatorViewAnalytics"("viewedAt");

-- Fraud Flags
CREATE TABLE IF NOT EXISTS "CreatorFraudFlag" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "flagType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "flaggedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "flaggedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP,
    "resolvedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_fraud_flag_user" ON "CreatorFraudFlag"("userId");
CREATE INDEX IF NOT EXISTS "idx_fraud_flag_resolved" ON "CreatorFraudFlag"("resolved");

-- IP Logs
CREATE TABLE IF NOT EXISTS "CreatorIPLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "ipAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "userAgent" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_ip_log_user" ON "CreatorIPLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_ip_log_timestamp" ON "CreatorIPLog"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_ip_log_suspicious" ON "CreatorIPLog"("suspicious");

-- Chargebacks
CREATE TABLE IF NOT EXISTS "CreatorChargeback" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "payoutRequestId" TEXT REFERENCES "PayoutRequest"("id") ON DELETE SET NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "processedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "processedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_chargeback_user" ON "CreatorChargeback"("userId");

-- Final verification
DO $$
DECLARE
    payout_table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payout_table_count
    FROM information_schema.tables
    WHERE table_name IN (
        'CreatorWallet',
        'CreatorWithdrawalPin',
        'CreatorEarning',
        'CreatorTier',
        'CreatorPayoutSettings',
        'PayoutRequest',
        'PayoutTransaction',
        'CreatorOffer',
        'CreatorOfferRedemption',
        'CreatorBonus',
        'CreatorViewAnalytics',
        'CreatorFraudFlag',
        'CreatorIPLog',
        'CreatorChargeback'
    );
    
    IF payout_table_count = 14 THEN
        RAISE NOTICE 'SUCCESS: All 14 payout system tables created!';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 14 payout tables exist', payout_table_count;
    END IF;
END$$;
