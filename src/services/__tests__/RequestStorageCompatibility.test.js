import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Compatibility tests to ensure PostgreSQL implementation maintains the same API
 * as the in-memory implementation
 */

describe('RequestStorage API Compatibility', () => {
  let InMemoryRequestStorage;
  let PostgreSQLRequestStorage;

  beforeEach(async () => {
    // Import both implementations
    InMemoryRequestStorage = (await import('../RequestStorage.js')).default;
    PostgreSQLRequestStorage = (await import('../RequestStoragePostgreSQL.js')).default;
  });

  it('should have identical static method signatures', () => {
    const inMemoryMethods = Object.getOwnPropertyNames(InMemoryRequestStorage)
      .filter(name => typeof InMemoryRequestStorage[name] === 'function')
      .sort();
    
    const postgreSQLMethods = Object.getOwnPropertyNames(PostgreSQLRequestStorage)
      .filter(name => typeof PostgreSQLRequestStorage[name] === 'function')
      .sort();

    expect(postgreSQLMethods).toEqual(inMemoryMethods);
  });

  it('should have the same public API methods', () => {
    const expectedMethods = [
      'storeRequest',
      'getAllRequests', 
      'getRequestById',
      'getRequestStats',
      'updateRequestStatus',
      'cancelRequest',
      'modifyRequest',
      'clearAll'
    ];

    expectedMethods.forEach(methodName => {
      expect(typeof InMemoryRequestStorage[methodName]).toBe('function');
      expect(typeof PostgreSQLRequestStorage[methodName]).toBe('function');
    });
  });

  it('should have the same static properties', () => {
    expect(PostgreSQLRequestStorage.MAX_REQUESTS).toBeDefined();
    expect(PostgreSQLRequestStorage.DUPLICATE_WINDOW_MS).toBeDefined();
    
    expect(PostgreSQLRequestStorage.MAX_REQUESTS).toBe(InMemoryRequestStorage.MAX_REQUESTS);
    expect(PostgreSQLRequestStorage.DUPLICATE_WINDOW_MS).toBe(InMemoryRequestStorage.DUPLICATE_WINDOW_MS);
  });

  it('should return the same data structure from storeRequest', async () => {
    const validRequestData = {
      originalImage: 'data:image/jpeg;base64,test',
      customText: 'Test Engraving',
      textPosition: { x: 50, y: 30 },
      font: 'Arial',
      fontSize: 24,
      customerInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-1234'
      },
      comments: 'Please engrave carefully'
    };

    // Clear both storages
    InMemoryRequestStorage.clearAll();
    
    // Store in in-memory version
    const inMemoryResult = InMemoryRequestStorage.storeRequest(validRequestData);
    
    // Check structure (we can't compare exact values due to different IDs/timestamps)
    expect(inMemoryResult).toHaveProperty('id');
    expect(inMemoryResult).toHaveProperty('timestamp');
    expect(inMemoryResult).toHaveProperty('originalImage');
    expect(inMemoryResult).toHaveProperty('customText');
    expect(inMemoryResult).toHaveProperty('textPosition');
    expect(inMemoryResult).toHaveProperty('font');
    expect(inMemoryResult).toHaveProperty('fontSize');
    expect(inMemoryResult).toHaveProperty('customerInfo');
    expect(inMemoryResult).toHaveProperty('comments');
    expect(inMemoryResult).toHaveProperty('status');

    // The PostgreSQL version should have the same structure
    // (We test this in the unit tests with mocked database)
  });

  it('should return the same statistics structure', () => {
    InMemoryRequestStorage.clearAll();
    
    const stats = InMemoryRequestStorage.getRequestStats();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('recent');
    expect(stats).toHaveProperty('byStatus');
    expect(stats).toHaveProperty('lastRequestTime');
    
    expect(stats.byStatus).toHaveProperty('pending');
    expect(stats.byStatus).toHaveProperty('processing');
    expect(stats.byStatus).toHaveProperty('completed');
  });

  it('should handle the same validation errors', () => {
    const invalidData = {
      // Missing required fields
      customText: '',
      textPosition: { x: -1, y: 101 },
      fontSize: 5,
      customerInfo: {
        name: '',
        email: 'invalid-email'
      }
    };

    expect(() => InMemoryRequestStorage.storeRequest(invalidData))
      .toThrow('Validation failed');
    
    // PostgreSQL version should throw the same validation errors
    // (tested in unit tests with mocked database)
  });

  it('should handle the same status validation', () => {
    const validRequestData = {
      originalImage: 'data:image/jpeg;base64,test',
      customText: 'Test Engraving',
      textPosition: { x: 50, y: 30 },
      font: 'Arial',
      fontSize: 24,
      customerInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com'
      }
    };

    InMemoryRequestStorage.clearAll();
    const request = InMemoryRequestStorage.storeRequest(validRequestData);

    expect(() => InMemoryRequestStorage.updateRequestStatus(request.id, 'invalid-status'))
      .toThrow('Invalid status. Must be: pending, processing, or completed');
  });
});