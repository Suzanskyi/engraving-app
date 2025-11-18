import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import RequestStorage from '../RequestStoragePostgreSQL.js';
import DatabaseConnection from '../DatabaseConnection.js';
import { SchemaManager } from '../../config/schemaManager.js';

/**
 * Integration tests for PostgreSQL-backed RequestStorage
 * 
 * These tests require a real PostgreSQL database connection.
 * To run these tests:
 * 1. Set up a test PostgreSQL database
 * 2. Set environment variables:
 *    - TEST_DB_HOST (default: localhost)
 *    - TEST_DB_PORT (default: 5432)
 *    - TEST_DB_NAME (default: suzengrave_test)
 *    - TEST_DB_USER (default: postgres)
 *    - TEST_DB_PASSWORD (default: empty)
 * 3. Run: npm test -- RequestStoragePostgreSQL.integration.test.js
 */

// Skip these tests if no database configuration is provided
const shouldSkipTests = !process.env.TEST_DB_NAME && !process.env.RUN_INTEGRATION_TESTS;

describe.skipIf(shouldSkipTests)('RequestStorage (PostgreSQL) - Integration Tests', () => {
  let schemaManager;

  // Sample valid request data for testing
  const validRequestData = {
    originalImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dh5zRQhgqjmvzPvGnfBH0fx/xZXuBqVL',
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

  beforeAll(async () => {
    // Initialize test database connection
    const testConfig = {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'suzengrave_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || '',
      max: 5, // Smaller pool for tests
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    try {
      await DatabaseConnection.initialize(testConfig);
      schemaManager = new SchemaManager(DatabaseConnection);
      await schemaManager.initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize test database:', error.message);
      console.log('Skipping integration tests - database not available');
      throw error;
    }
  });

  afterAll(async () => {
    if (DatabaseConnection.isInitialized) {
      await DatabaseConnection.close();
    }
  });

  beforeEach(async () => {
    // Clear all requests before each test
    await RequestStorage.clearAll();
  });

  describe('Real Database Operations', () => {
    it('should store and retrieve a request from actual PostgreSQL', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);
      
      expect(storedRequest).toHaveProperty('id');
      expect(storedRequest).toHaveProperty('timestamp');
      expect(storedRequest.timestamp).toBeInstanceOf(Date);
      
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);
      expect(retrievedRequest).toEqual(storedRequest);
    });

    it('should maintain data consistency across multiple operations', async () => {
      // Store multiple requests
      const request1 = await RequestStorage.storeRequest(validRequestData);
      const request2 = await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      // Verify they're all stored
      const allRequests = await RequestStorage.getAllRequests();
      expect(allRequests).toHaveLength(2);

      // Update status of one
      await RequestStorage.updateRequestStatus(request1.id, 'processing');

      // Verify statistics are correct
      const stats = await RequestStorage.getRequestStats();
      expect(stats.total).toBe(2);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.processing).toBe(1);

      // Cancel one request
      await RequestStorage.cancelRequest(request2.id);

      // Verify final state
      const finalStats = await RequestStorage.getRequestStats();
      expect(finalStats.total).toBe(1);
      expect(finalStats.byStatus.pending).toBe(0);
      expect(finalStats.byStatus.processing).toBe(1);
    });

    it('should handle concurrent operations without data corruption', async () => {
      // Create multiple requests concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          RequestStorage.storeRequest({
            ...validRequestData,
            customerInfo: { 
              ...validRequestData.customerInfo, 
              email: `user${i}@example.com` 
            }
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);

      // Verify all requests are stored
      const allRequests = await RequestStorage.getAllRequests();
      expect(allRequests).toHaveLength(5);

      // Verify statistics are correct
      const stats = await RequestStorage.getRequestStats();
      expect(stats.total).toBe(5);
      expect(stats.byStatus.pending).toBe(5);
    });

    it('should properly handle database transactions and rollbacks', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);
      
      // Verify request exists
      expect(await RequestStorage.getRequestById(request.id)).toBeTruthy();
      
      // Try to modify with invalid data (should fail)
      const invalidData = {
        ...validRequestData,
        customText: '', // Invalid
        customerInfo: { name: '', email: 'invalid' }
      };
      
      await expect(RequestStorage.modifyRequest(request.id, invalidData))
        .rejects.toThrow('Validation failed');
      
      // Verify original request is unchanged
      const unchangedRequest = await RequestStorage.getRequestById(request.id);
      expect(unchangedRequest.customText).toBe(validRequestData.customText);
    });

    it('should enforce database constraints', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);
      
      // Try to store duplicate within time window
      await expect(RequestStorage.storeRequest(validRequestData))
        .rejects.toThrow('Duplicate request detected');
      
      // Verify only one request exists
      const allRequests = await RequestStorage.getAllRequests();
      expect(allRequests).toHaveLength(1);
    });

    it('should handle large text fields correctly', async () => {
      const largeTextData = {
        ...validRequestData,
        customText: 'A'.repeat(100), // Max allowed length
        comments: 'B'.repeat(500)    // Max allowed length
      };
      
      const storedRequest = await RequestStorage.storeRequest(largeTextData);
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);
      
      expect(retrievedRequest.customText).toBe(largeTextData.customText);
      expect(retrievedRequest.comments).toBe(largeTextData.comments);
    });

    it('should maintain precision for decimal values', async () => {
      const preciseData = {
        ...validRequestData,
        textPosition: { x: 12.345678, y: 87.654321 }
      };
      
      const storedRequest = await RequestStorage.storeRequest(preciseData);
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);
      
      expect(retrievedRequest.textPosition.x).toBeCloseTo(12.345678, 6);
      expect(retrievedRequest.textPosition.y).toBeCloseTo(87.654321, 6);
    });

    it('should handle null values correctly', async () => {
      const dataWithNulls = {
        ...validRequestData,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com'
          // phone is undefined/null
        }
        // comments is undefined/null
      };
      
      const storedRequest = await RequestStorage.storeRequest(dataWithNulls);
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);
      
      expect(retrievedRequest.customerInfo.phone).toBeNull();
      expect(retrievedRequest.comments).toBe('');
    });
  });

  describe('Performance Tests', () => {
    it('should handle batch operations efficiently', async () => {
      const startTime = Date.now();
      
      // Store 50 requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          RequestStorage.storeRequest({
            ...validRequestData,
            customerInfo: { 
              ...validRequestData.customerInfo, 
              email: `batch${i}@example.com` 
            }
          })
        );
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      // Verify all requests were stored
      const allRequests = await RequestStorage.getAllRequests();
      expect(allRequests).toHaveLength(50);
    });

    it('should retrieve large datasets efficiently', async () => {
      // Store 100 requests first
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          RequestStorage.storeRequest({
            ...validRequestData,
            customerInfo: { 
              ...validRequestData.customerInfo, 
              email: `perf${i}@example.com` 
            }
          })
        );
      }
      
      await Promise.all(promises);
      
      // Time the retrieval
      const startTime = Date.now();
      const allRequests = await RequestStorage.getAllRequests();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      expect(allRequests).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should retrieve within 1 second
    });
  });
});