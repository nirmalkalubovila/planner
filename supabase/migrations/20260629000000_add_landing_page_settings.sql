-- Add show_on_landing column to feedbacks table if it does not exist
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS show_on_landing boolean DEFAULT false;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_position text;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating integer DEFAULT 5;

-- Create landing_page_settings table
CREATE TABLE IF NOT EXISTS landing_page_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  desktop_video_url text NOT NULL DEFAULT 'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4',
  mobile_video_url text NOT NULL DEFAULT 'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4',
  desktop_gallery jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of strings (image URLs)
  mobile_gallery jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Array of strings (image URLs)
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Initialize default landing_page_settings row
INSERT INTO landing_page_settings (id, desktop_video_url, mobile_video_url, desktop_gallery, mobile_gallery)
VALUES (
  1, 
  'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4', 
  'https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4', 
  '[]'::jsonb, 
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to landing page settings
DROP POLICY IF EXISTS "Anyone can read landing_page_settings" ON landing_page_settings;
CREATE POLICY "Anyone can read landing_page_settings" ON landing_page_settings
  FOR SELECT USING (true);

-- Allow admins to manage landing page settings
DROP POLICY IF EXISTS "Admin can manage landing_page_settings" ON landing_page_settings;
CREATE POLICY "Admin can manage landing_page_settings" ON landing_page_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'legacylifebuilder.konik@email.com');

-- Allow anyone to read approved feedbacks to show on landing page
DROP POLICY IF EXISTS "Anyone can read approved feedbacks" ON feedbacks;
CREATE POLICY "Anyone can read approved feedbacks" ON feedbacks
  FOR SELECT USING (show_on_landing = true);
