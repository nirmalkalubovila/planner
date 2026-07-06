-- Migration to add maintenance_mode column to landing_page_settings table
ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false NOT NULL;
