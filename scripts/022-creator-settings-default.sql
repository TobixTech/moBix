-- Create default creator settings if none exist
INSERT INTO "CreatorSettings" (
  "id",
  "minAccountAgeDays",
  "maxAccountAgeDays",
  "defaultDailyUploadLimit",
  "defaultDailyStorageLimitGb",
  "autoApproveNewCreators",
  "maxStrikesBeforeSuspension",
  "isCreatorSystemEnabled",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  30,
  90,
  4,
  8.00,
  false,
  3,
  true,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "CreatorSettings" LIMIT 1);
