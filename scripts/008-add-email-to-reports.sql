-- Add email column to content_reports table
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS email TEXT;
