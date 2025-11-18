-- SuzEngrave Database Schema
-- PostgreSQL schema for engraving request management system

-- Create engraving_requests table
CREATE TABLE IF NOT EXISTS engraving_requests (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    original_image TEXT,
    original_text TEXT,
    composed_image TEXT,
    custom_text TEXT NOT NULL,
    text_position_x DECIMAL(10,6) NOT NULL,
    text_position_y DECIMAL(10,6) NOT NULL,
    font VARCHAR(100) NOT NULL,
    font_size INTEGER NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    comments TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_engraving_requests_email ON engraving_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_engraving_requests_status ON engraving_requests(status);
CREATE INDEX IF NOT EXISTS idx_engraving_requests_timestamp ON engraving_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_engraving_requests_created_at ON engraving_requests(created_at);

-- Create request_metadata table for statistics tracking
CREATE TABLE IF NOT EXISTS request_metadata (
    id SERIAL PRIMARY KEY,
    total_requests INTEGER NOT NULL DEFAULT 0,
    last_request_time TIMESTAMP WITH TIME ZONE,
    pending_count INTEGER NOT NULL DEFAULT 0,
    processing_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Initialize metadata table with default row if it doesn't exist
INSERT INTO request_metadata (id, total_requests, pending_count, processing_count, completed_count)
SELECT 1, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM request_metadata WHERE id = 1);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for engraving_requests table
DROP TRIGGER IF EXISTS update_engraving_requests_updated_at ON engraving_requests;
CREATE TRIGGER update_engraving_requests_updated_at
    BEFORE UPDATE ON engraving_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for request_metadata table
DROP TRIGGER IF EXISTS update_request_metadata_updated_at ON request_metadata;
CREATE TRIGGER update_request_metadata_updated_at
    BEFORE UPDATE ON request_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();