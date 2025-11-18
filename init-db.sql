-- Initialize databases for SuzEngrave application
-- This script runs when the PostgreSQL container starts for the first time

-- Create the test database
CREATE DATABASE suzengrave_test;

-- Grant permissions (postgres user already has full access)
GRANT ALL PRIVILEGES ON DATABASE suzengrave TO postgres;
GRANT ALL PRIVILEGES ON DATABASE suzengrave_test TO postgres;

-- Log initialization
\echo 'SuzEngrave databases initialized successfully'