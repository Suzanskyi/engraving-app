/**
 * Tests for SchemaManager
 * Tests database schema creation, validation, and migration utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaManager, createSchemaManager } from '../schemaManager.js';

// Mock database connection
const mockDb = {
  query: vi.fn(),
};

describe('SchemaManager', () => {
  let schemaManager;

  beforeEach(() => {
    schemaManager = new SchemaManager(mockDb);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create SchemaManager with database connection', () => {
      expect(schemaManager.db).toBe(mockDb);
      expect(schemaManager.schemaVersion).toBe('1.0.0');
    });
  });

  describe('initializeDatabase', () => {
    it('should successfully initialize database schema', async () => {
      // Mock successful schema execution and verification
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Schema creation
        .mockResolvedValueOnce({ // Table verification
          rows: [
            { table_name: 'engraving_requests' },
            { table_name: 'request_metadata' }
          ]
        })
        .mockResolvedValueOnce({ // Index verification
          rows: [
            { indexname: 'idx_engraving_requests_email' },
            { indexname: 'idx_engraving_requests_status' },
            { indexname: 'idx_engraving_requests_timestamp' },
            { indexname: 'idx_engraving_requests_created_at' }
          ]
        });

      await expect(schemaManager.initializeDatabase()).resolves.toBeUndefined();
      expect(mockDb.query).toHaveBeenCalledTimes(3);
    });

    it('should throw error if schema creation fails', async () => {
      const error = new Error('Schema creation failed');
      mockDb.query.mockRejectedValueOnce(error);

      await expect(schemaManager.initializeDatabase()).rejects.toThrow(
        'Schema initialization failed: Schema creation failed'
      );
    });

    it('should throw error if schema verification fails', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Schema creation succeeds
        .mockRejectedValueOnce(new Error('Verification failed')); // Verification fails

      await expect(schemaManager.initializeDatabase()).rejects.toThrow(
        'Schema initialization failed: Verification failed'
      );
    });
  });

  describe('verifySchema', () => {
    it('should successfully verify complete schema', async () => {
      mockDb.query
        .mockResolvedValueOnce({ // Table check
          rows: [
            { table_name: 'engraving_requests' },
            { table_name: 'request_metadata' }
          ]
        })
        .mockResolvedValueOnce({ // Index check
          rows: [
            { indexname: 'idx_engraving_requests_email' },
            { indexname: 'idx_engraving_requests_status' },
            { indexname: 'idx_engraving_requests_timestamp' },
            { indexname: 'idx_engraving_requests_created_at' }
          ]
        });

      const result = await schemaManager.verifySchema();
      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error for missing tables', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ table_name: 'engraving_requests' }] // Missing request_metadata
      });

      await expect(schemaManager.verifySchema()).rejects.toThrow(
        'Missing required tables: request_metadata'
      );
    });

    it('should warn about missing indexes but not fail', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockDb.query
        .mockResolvedValueOnce({ // All tables exist
          rows: [
            { table_name: 'engraving_requests' },
            { table_name: 'request_metadata' }
          ]
        })
        .mockResolvedValueOnce({ // Some indexes missing
          rows: [
            { indexname: 'idx_engraving_requests_email' },
            { indexname: 'idx_engraving_requests_status' }
          ]
        });

      const result = await schemaManager.verifySchema();
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing indexes (will be created)')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle database query errors', async () => {
      const error = new Error('Database connection failed');
      mockDb.query.mockRejectedValueOnce(error);

      await expect(schemaManager.verifySchema()).rejects.toThrow(error);
    });
  });

  describe('getSchemaVersion', () => {
    it('should return current version from existing table', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists
        .mockResolvedValueOnce({ rows: [{ version: '1.2.0' }] }); // Current version

      const version = await schemaManager.getSchemaVersion();
      expect(version).toBe('1.2.0');
    });

    it('should create version table and return default version if table does not exist', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: false }] }) // Table doesn't exist
        .mockResolvedValueOnce({ rows: [] }); // Create table

      const version = await schemaManager.getSchemaVersion();
      expect(version).toBe('1.0.0');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should return default version if no version records exist', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists
        .mockResolvedValueOnce({ rows: [] }); // No version records

      const version = await schemaManager.getSchemaVersion();
      expect(version).toBe('1.0.0');
    });

    it('should handle errors gracefully and return default version', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const version = await schemaManager.getSchemaVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('createSchemaVersionTable', () => {
    it('should create schema version table successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(schemaManager.createSchemaVersionTable()).resolves.toBeUndefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_version')
      );
    });
  });

  describe('dropAllTables', () => {
    it('should drop all tables successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(schemaManager.dropAllTables()).resolves.toBeUndefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DROP TABLE IF EXISTS')
      );
    });

    it('should handle errors when dropping tables', async () => {
      const error = new Error('Drop failed');
      mockDb.query.mockRejectedValueOnce(error);

      await expect(schemaManager.dropAllTables()).rejects.toThrow(error);
    });
  });

  describe('resetDatabase', () => {
    it('should reset database by dropping and recreating schema', async () => {
      // Mock dropAllTables
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock initializeDatabase calls
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Schema creation
        .mockResolvedValueOnce({ // Table verification
          rows: [
            { table_name: 'engraving_requests' },
            { table_name: 'request_metadata' }
          ]
        })
        .mockResolvedValueOnce({ // Index verification
          rows: [
            { indexname: 'idx_engraving_requests_email' },
            { indexname: 'idx_engraving_requests_status' },
            { indexname: 'idx_engraving_requests_timestamp' },
            { indexname: 'idx_engraving_requests_created_at' }
          ]
        });

      await expect(schemaManager.resetDatabase()).resolves.toBeUndefined();
      expect(mockDb.query).toHaveBeenCalledTimes(4); // 1 drop + 3 initialize
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy database', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ test: 1 }] }) // Basic query
        .mockResolvedValueOnce({ // Table verification
          rows: [
            { table_name: 'engraving_requests' },
            { table_name: 'request_metadata' }
          ]
        })
        .mockResolvedValueOnce({ // Index verification
          rows: [
            { indexname: 'idx_engraving_requests_email' },
            { indexname: 'idx_engraving_requests_status' },
            { indexname: 'idx_engraving_requests_timestamp' },
            { indexname: 'idx_engraving_requests_created_at' }
          ]
        });

      const result = await schemaManager.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false for unhealthy database', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await schemaManager.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      const mockStats = {
        total_requests: 10,
        pending_requests: 3,
        processing_requests: 2,
        completed_requests: 5,
        last_request_time: '2024-01-01T00:00:00Z'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockStats] });

      const stats = await schemaManager.getDatabaseStats();
      expect(stats).toEqual(mockStats);
    });

    it('should return default stats if no data exists', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const stats = await schemaManager.getDatabaseStats();
      expect(stats).toEqual({
        total_requests: 0,
        pending_requests: 0,
        processing_requests: 0,
        completed_requests: 0,
        last_request_time: null
      });
    });

    it('should throw error if query fails', async () => {
      const error = new Error('Stats query failed');
      mockDb.query.mockRejectedValueOnce(error);

      await expect(schemaManager.getDatabaseStats()).rejects.toThrow(error);
    });
  });
});

describe('createSchemaManager', () => {
  it('should create and return SchemaManager instance', () => {
    const manager = createSchemaManager(mockDb);
    expect(manager).toBeInstanceOf(SchemaManager);
    expect(manager.db).toBe(mockDb);
  });
});