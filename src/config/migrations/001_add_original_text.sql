-- Migration: Add original_text column and make original_image nullable
-- Version: 1.1.0

-- Add original_text column if it doesn't exist
ALTER TABLE engraving_requests 
ADD COLUMN IF NOT EXISTS original_text TEXT;

-- Make original_image nullable (if it's currently NOT NULL)
ALTER TABLE engraving_requests 
ALTER COLUMN original_image DROP NOT NULL;

-- Add constraint to ensure at least one of original_image or original_text is provided
ALTER TABLE engraving_requests 
ADD CONSTRAINT check_original_content 
CHECK (original_image IS NOT NULL OR original_text IS NOT NULL);

-- Update schema version
INSERT INTO schema_version (version, description) 
VALUES ('1.1.0', 'Added original_text column and made original_image optional')
ON CONFLICT DO NOTHING;