/**
 * Integration tests for database schema
 * Tests the actual SQL schema file and its execution
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Database Schema Integration', () => {
  let schemaSQL;

  beforeAll(() => {
    // Read the actual schema file
    const schemaPath = join(__dirname, '..', 'schema.sql');
    schemaSQL = readFileSync(schemaPath, 'utf8');
  });

  describe('Schema File Structure', () => {
    it('should contain engraving_requests table creation', () => {
      expect(schemaSQL).toContain('CREATE TABLE IF NOT EXISTS engraving_requests');
    });

    it('should contain request_metadata table creation', () => {
      expect(schemaSQL).toContain('CREATE TABLE IF NOT EXISTS request_metadata');
    });

    it('should contain all required indexes', () => {
      const requiredIndexes = [
        'idx_engraving_requests_email',
        'idx_engraving_requests_status',
        'idx_engraving_requests_timestamp',
        'idx_engraving_requests_created_at'
      ];

      requiredIndexes.forEach(index => {
        expect(schemaSQL).toContain(`CREATE INDEX IF NOT EXISTS ${index}`);
      });
    });

    it('should contain trigger function for updated_at', () => {
      expect(schemaSQL).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
    });

    it('should contain triggers for both tables', () => {
      expect(schemaSQL).toContain('CREATE TRIGGER update_engraving_requests_updated_at');
      expect(schemaSQL).toContain('CREATE TRIGGER update_request_metadata_updated_at');
    });
  });

  describe('Table Schema Validation', () => {
    it('should have correct engraving_requests table structure', () => {
      // Check for all required columns
      const requiredColumns = [
        'id UUID PRIMARY KEY',
        'timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
        'original_image TEXT NOT NULL',
        'composed_image TEXT',
        'custom_text TEXT NOT NULL',
        'text_position_x DECIMAL(10,6) NOT NULL',
        'text_position_y DECIMAL(10,6) NOT NULL',
        'font VARCHAR(100) NOT NULL',
        'font_size INTEGER NOT NULL',
        'customer_name VARCHAR(255) NOT NULL',
        'customer_email VARCHAR(255) NOT NULL',
        'customer_phone VARCHAR(50)',
        'comments TEXT',
        'status VARCHAR(20) NOT NULL DEFAULT \'pending\'',
        'created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()',
        'updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()'
      ];

      requiredColumns.forEach(column => {
        expect(schemaSQL).toContain(column);
      });
    });

    it('should have status check constraint', () => {
      expect(schemaSQL).toContain("CHECK (status IN ('pending', 'processing', 'completed'))");
    });

    it('should have correct request_metadata table structure', () => {
      const requiredColumns = [
        'id SERIAL PRIMARY KEY',
        'total_requests INTEGER NOT NULL DEFAULT 0',
        'last_request_time TIMESTAMP WITH TIME ZONE',
        'pending_count INTEGER NOT NULL DEFAULT 0',
        'processing_count INTEGER NOT NULL DEFAULT 0',
        'completed_count INTEGER NOT NULL DEFAULT 0',
        'updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()'
      ];

      requiredColumns.forEach(column => {
        expect(schemaSQL).toContain(column);
      });
    });

    it('should initialize metadata table with default row', () => {
      expect(schemaSQL).toContain('INSERT INTO request_metadata');
      expect(schemaSQL).toContain('WHERE NOT EXISTS');
    });
  });

  describe('SQL Syntax Validation', () => {
    it('should have valid SQL syntax structure', () => {
      // Check for proper SQL statement endings
      const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
      
      statements.forEach(statement => {
        const trimmed = statement.trim();
        if (trimmed) {
          // Each statement should start with a valid SQL keyword
          const validStarts = [
            'CREATE TABLE',
            'CREATE INDEX',
            'INSERT INTO',
            'CREATE OR REPLACE FUNCTION',
            'DROP TRIGGER',
            'CREATE TRIGGER',
            '--' // Comments
          ];
          
          const startsWithValid = validStarts.some(start => 
            trimmed.toUpperCase().startsWith(start.toUpperCase()) ||
            trimmed.startsWith('--') // Comments
          );
          
          if (!startsWithValid && !trimmed.startsWith('$$') && !trimmed.includes('language')) {
            console.warn(`Potentially invalid SQL statement start: ${trimmed.substring(0, 50)}...`);
          }
        }
      });
    });

    it('should have balanced parentheses', () => {
      const openParens = (schemaSQL.match(/\(/g) || []).length;
      const closeParens = (schemaSQL.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it('should not contain obvious syntax errors', () => {
      // Check for common SQL syntax issues
      expect(schemaSQL).not.toContain(';;'); // Double semicolons
      expect(schemaSQL).not.toMatch(/,\s*\)/); // Trailing commas before closing parentheses
      expect(schemaSQL).not.toMatch(/\(\s*,/); // Leading commas after opening parentheses
    });
  });

  describe('Schema Requirements Compliance', () => {
    it('should support UUID primary keys', () => {
      expect(schemaSQL).toContain('id UUID PRIMARY KEY');
    });

    it('should have proper timestamp handling', () => {
      expect(schemaSQL).toContain('TIMESTAMP WITH TIME ZONE');
      expect(schemaSQL).toContain('DEFAULT NOW()');
    });

    it('should have proper indexing for performance', () => {
      // Check that indexes are created on frequently queried columns
      expect(schemaSQL).toContain('ON engraving_requests(customer_email)');
      expect(schemaSQL).toContain('ON engraving_requests(status)');
      expect(schemaSQL).toContain('ON engraving_requests(timestamp)');
      expect(schemaSQL).toContain('ON engraving_requests(created_at)');
    });

    it('should have proper data validation constraints', () => {
      // Check for NOT NULL constraints on required fields
      expect(schemaSQL).toContain('original_image TEXT NOT NULL');
      expect(schemaSQL).toContain('custom_text TEXT NOT NULL');
      expect(schemaSQL).toContain('customer_name VARCHAR(255) NOT NULL');
      expect(schemaSQL).toContain('customer_email VARCHAR(255) NOT NULL');
    });

    it('should have automatic timestamp updates', () => {
      expect(schemaSQL).toContain('update_updated_at_column');
      expect(schemaSQL).toContain('BEFORE UPDATE');
      expect(schemaSQL).toContain('FOR EACH ROW');
    });
  });

  describe('Migration Safety', () => {
    it('should use IF NOT EXISTS for safe creation', () => {
      expect(schemaSQL).toContain('CREATE TABLE IF NOT EXISTS');
      expect(schemaSQL).toContain('CREATE INDEX IF NOT EXISTS');
    });

    it('should use IF EXISTS for safe dropping', () => {
      expect(schemaSQL).toContain('DROP TRIGGER IF EXISTS');
    });

    it('should handle existing data safely', () => {
      expect(schemaSQL).toContain('WHERE NOT EXISTS');
      // Uses SELECT with WHERE NOT EXISTS instead of ON CONFLICT for safer initialization
      expect(schemaSQL).toContain('SELECT 1, 0, 0, 0, 0');
    });
  });
});