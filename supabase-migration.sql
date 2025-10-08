
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  scene_version INTEGER NOT NULL DEFAULT 0,
  iv TEXT NOT NULL, -- base64 encoded initialization vector
  ciphertext TEXT NOT NULL, -- base64 encoded encrypted scene data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on scene_version for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_scene_version ON scenes(scene_version);

-- Create an index on created_at for cleanup and analytics
CREATE INDEX IF NOT EXISTS idx_scenes_created_at ON scenes(created_at);

-- Create the excalidraw-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('excalidraw-files', 'excalidraw-files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) for the scenes table
-- Allow authenticated users to perform all operations
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update/select from scenes (since we're using room keys for access control)
-- In production, you might want to restrict this further based on your authentication requirements
CREATE POLICY "Allow all operations on scenes" ON scenes
FOR ALL USING (true);

-- Set up storage policies for the excalidraw-files bucket
-- Allow anyone to upload/download files (access control is handled by the application)
CREATE POLICY "Allow uploads to excalidraw-files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'excalidraw-files');

CREATE POLICY "Allow downloads from excalidraw-files" ON storage.objects
FOR SELECT USING (bucket_id = 'excalidraw-files');

-- Optional: Add a function to clean up old scenes (useful for development/testing)
CREATE OR REPLACE FUNCTION cleanup_old_scenes(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM scenes
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
