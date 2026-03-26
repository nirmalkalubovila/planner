-- Add title and category to vault_notes
ALTER TABLE vault_notes ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE vault_notes ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'ideas';
