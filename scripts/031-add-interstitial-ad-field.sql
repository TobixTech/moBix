-- Add interstitial ad code field to ad settings
ALTER TABLE "AdSettings" ADD COLUMN "interstitialAdCode" TEXT;
