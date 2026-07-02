-- Add consent_to_show column to feedbacks table if it does not exist
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS consent_to_show boolean DEFAULT false;
