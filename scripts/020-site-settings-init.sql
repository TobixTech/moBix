-- Create SiteSettings table if not exists
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "type" TEXT DEFAULT 'string',
  "description" TEXT,
  "updatedAt" TIMESTAMP DEFAULT now(),
  "createdAt" TIMESTAMP DEFAULT now()
);

-- Insert default settings if they don't exist
INSERT INTO "SiteSettings" ("key", "value", "type", "description")
VALUES 
  ('maintenanceMode', 'false', 'boolean', 'Enable maintenance mode'),
  ('allowRegistrations', 'true', 'boolean', 'Allow new user registrations'),
  ('enableComments', 'true', 'boolean', 'Enable comments on content'),
  ('enableDownloads', 'true', 'boolean', 'Enable content downloads')
ON CONFLICT ("key") DO NOTHING;
