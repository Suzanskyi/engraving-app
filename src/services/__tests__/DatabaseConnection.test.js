/**
 * Unit tests for DatabaseConnection class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DatabaseConnection from '../DatabaseConnection.js';

// Mock the pg module
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  
  const mockPool = {
    connect: vi.fn(() => Promise.resolve(mockClient)),
    query: vi.fn(),
    end: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    totalCount: 10,
    idleCount: 5,
    waitingCount: 2,
  };
  
  return {
    default: {
      Pool: vi.fn(() => mockPool),
    },
    Pool: vi.fn(() => mockPool),
  };
});

// Mock the database config
vi.mock('../config/database.js', () => ({
  getDatabaseConfig: vi.fn(() => ({
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_pass',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })),
  validateDatabaseConfig: vi.fn(),
}));

describe('DatabaseConnection', () => {
  let mockPool;
  let mockClient;

  beforeEach(async () => {
    // Reset the DatabaseConnection state
    DatabaseConnection.pool = null;
    DatabaseConnection.isInitialized = false;
    
    // Get fresh mocks
    const { Pool } = await import('pg');
    mockPool = new Pool();
    mockClient = await mockPool.connect();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    if (DatabaseConnection.isInitialized) {
      await DatabaseConnection.close();
    }
  });

  describe('initialize', () => {
    it('should initialize database connection pool successfully', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      
      await DatabaseConnection.initialize();
      
      expect(DatabaseConnection.isInitialized).toBe(true);
      expect(DatabaseConnection.pool).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(DatabaseConnection.initialize()).rejects.toThrow('Database initialization failed');
      expect(DatabaseConnection.isInitialized).toBe(false);
    });

    it('should use custom config when provided', async () => {
      const customConfig = {
        host: 'custom-host',
        port: 5433,
        database: 'custom_db',
        user: 'custom_user',
        password: 'custom_pass',
        max: 10,
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      
      await DatabaseConnection.initialize(customConfig);
      
      expect(DatabaseConnection.isInitialized).toBe(true);
    });

    it('should set up error handler for pool', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      
      await DatabaseConnection.initialize();
      
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      vi.clearAllMocks();
    });

    it('should execute query successfully', async () => {
      const expectedResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
      mockPool.query.mockResolvedValueOnce(expectedResult);
      
      const result = await DatabaseConnection.query('SELECT * FROM test WHERE id = $1', [1]);
      
      expect(result).toEqual(expectedResult);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
    });

    it('should throw error when not initialized', async () => {
      DatabaseConnection.isInitialized = false;
      
      await expect(DatabaseConnection.query('SELECT 1')).rejects.toThrow(
        'Database connection not initialized'
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(DatabaseConnection.query('SELECT 1')).rejects.toThrow('Database query failed');
    });

    it('should transform duplicate key error', async () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      mockPool.query.mockRejectedValueOnce(error);
      
      await expect(DatabaseConnection.query('INSERT INTO test')).rejects.toThrow(
        'Duplicate entry: A record with this information already exists'
      );
    });

    it('should transform foreign key constraint error', async () => {
      const error = new Error('Foreign key constraint');
      error.code = '23503';
      mockPool.query.mockRejectedValueOnce(error);
      
      await expect(DatabaseConnection.query('INSERT INTO test')).rejects.toThrow(
        'Invalid reference: Referenced record does not exist'
      );
    });

    it('should transform check constraint error', async () => {
      const error = new Error('Check constraint');
      error.code = '23514';
      mockPool.query.mockRejectedValueOnce(error);
      
      await expect(DatabaseConnection.query('INSERT INTO test')).rejects.toThrow(
        'Invalid data: Data violates database constraints'
      );
    });

    it('should transform connection refused error', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      mockPool.query.mockRejectedValueOnce(error);
      
      await expect(DatabaseConnection.query('SELECT 1')).rejects.toThrow(
        'Database connection refused: Please check if PostgreSQL is running'
      );
    });
  }); 
 describe('transaction', () => {
    beforeEach(async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      vi.clearAllMocks();
    });

    it('should execute transaction successfully', async () => {
      const mockCallback = vi.fn().mockResolvedValueOnce('success');
      mockClient.query.mockResolvedValue({ rows: [] });
      
      const result = await DatabaseConnection.transaction(mockCallback);
      
      expect(result).toBe('success');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockCallback = vi.fn().mockRejectedValueOnce(new Error('Callback error'));
      mockClient.query.mockResolvedValue({ rows: [] });
      
      await expect(DatabaseConnection.transaction(mockCallback)).rejects.toThrow('Transaction failed');
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when not initialized', async () => {
      DatabaseConnection.isInitialized = false;
      
      await expect(DatabaseConnection.transaction(() => {})).rejects.toThrow(
        'Database connection not initialized'
      );
    });

    it('should release client even if rollback fails', async () => {
      const mockCallback = vi.fn().mockRejectedValueOnce(new Error('Callback error'));
      mockClient.query.mockImplementation((query) => {
        if (query === 'ROLLBACK') {
          return Promise.reject(new Error('Rollback failed'));
        }
        return Promise.resolve({ rows: [] });
      });
      
      await expect(DatabaseConnection.transaction(mockCallback)).rejects.toThrow('Transaction failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getPoolStats', () => {
    it('should return pool statistics when pool exists', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      
      const stats = DatabaseConnection.getPoolStats();
      
      expect(stats).toEqual({
        totalCount: 10,
        idleCount: 5,
        waitingCount: 2,
      });
    });

    it('should return zero stats when pool does not exist', () => {
      const stats = DatabaseConnection.getPoolStats();
      
      expect(stats).toEqual({
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
    });
  });

  describe('isHealthy', () => {
    beforeEach(async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      vi.clearAllMocks();
    });

    it('should return true when database is healthy', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ health_check: 1 }] });
      
      const isHealthy = await DatabaseConnection.isHealthy();
      
      expect(isHealthy).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1 as health_check', []);
    });

    it('should return false when database is unhealthy', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Connection failed'));
      
      const isHealthy = await DatabaseConnection.isHealthy();
      
      expect(isHealthy).toBe(false);
    });

    it('should return false when not initialized', async () => {
      DatabaseConnection.isInitialized = false;
      
      const isHealthy = await DatabaseConnection.isHealthy();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      vi.clearAllMocks();
    });

    it('should close pool successfully', async () => {
      await DatabaseConnection.close();
      
      expect(mockPool.end).toHaveBeenCalled();
      expect(DatabaseConnection.pool).toBeNull();
      expect(DatabaseConnection.isInitialized).toBe(false);
    });

    it('should handle close error', async () => {
      mockPool.end.mockRejectedValueOnce(new Error('Close failed'));
      
      await expect(DatabaseConnection.close()).rejects.toThrow('Failed to close database connection');
    });

    it('should not throw error when pool is already null', async () => {
      DatabaseConnection.pool = null;
      
      await expect(DatabaseConnection.close()).resolves.toBeUndefined();
    });
  });

  describe('queryWithRetry', () => {
    beforeEach(async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] });
      await DatabaseConnection.initialize();
      vi.clearAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const expectedResult = { rows: [{ id: 1 }] };
      mockPool.query.mockResolvedValueOnce(expectedResult);
      
      const result = await DatabaseConnection.queryWithRetry('SELECT 1');
      
      expect(result).toEqual(expectedResult);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient errors', async () => {
      const expectedResult = { rows: [{ id: 1 }] };
      mockPool.query
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce(expectedResult);
      
      const result = await DatabaseConnection.queryWithRetry('SELECT 1', [], 3, 10);
      
      expect(result).toEqual(expectedResult);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should not retry on constraint violation errors', async () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      mockPool.query.mockRejectedValueOnce(error);
      
      await expect(DatabaseConnection.queryWithRetry('INSERT INTO test')).rejects.toThrow(
        'Duplicate entry: A record with this information already exists'
      );
      
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const error = new Error('Connection timeout');
      mockPool.query.mockRejectedValue(error);
      
      await expect(DatabaseConnection.queryWithRetry('SELECT 1', [], 2, 10)).rejects.toThrow(
        'Connection timeout'
      );
      
      expect(mockPool.query).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});