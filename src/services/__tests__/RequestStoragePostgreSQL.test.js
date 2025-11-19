import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import RequestStorage from '../RequestStoragePostgreSQL.js';
import DatabaseConnection from '../DatabaseConnection.js';

// Mock DatabaseConnection for unit tests
vi.mock('../DatabaseConnection.js', () => {
  const mockRows = [];
  let mockMetadata = {
    total_requests: 0,
    pending_count: 0,
    processing_count: 0,
    completed_count: 0,
    last_request_time: null
  };

  return {
    default: {
      query: vi.fn().mockImplementation((query, params = []) => {
        // Mock different query responses based on query content
        if (query.includes('SELECT COUNT(*) as count FROM engraving_requests')) {
          return Promise.resolve({ rows: [{ count: mockRows.length.toString() }] });
        }

        if (query.includes('INSERT INTO engraving_requests')) {
          const newRow = {
            id: params[0],
            timestamp: params[1],
            original_image: params[2],
            original_text: params[3],
            composed_image: params[4],
            custom_text: params[5],
            text_position_x: params[6],
            text_position_y: params[7],
            font: params[8],
            font_size: params[9],
            customer_name: params[10],
            customer_email: params[11],
            customer_phone: params[12],
            comments: params[13],
            status: params[14]
          };
          mockRows.push(newRow);
          return Promise.resolve({ rows: [newRow] });
        }

        if (query.includes('SELECT * FROM engraving_requests ORDER BY timestamp DESC')) {
          return Promise.resolve({ rows: [...mockRows].reverse() });
        }

        if (query.includes('SELECT * FROM engraving_requests WHERE id = $1')) {
          const found = mockRows.find(row => row.id === params[0]);
          return Promise.resolve({ rows: found ? [found] : [] });
        }

        if (query.includes('UPDATE engraving_requests SET status = $1 WHERE id = $2')) {
          const found = mockRows.find(row => row.id === params[1]);
          if (found) {
            found.status = params[0];
            return Promise.resolve({ rowCount: 1 });
          }
          return Promise.resolve({ rowCount: 0 });
        }

        if (query.includes('DELETE FROM engraving_requests WHERE id = $1')) {
          const index = mockRows.findIndex(row => row.id === params[0]);
          if (index !== -1) {
            mockRows.splice(index, 1);
            return Promise.resolve({ rowCount: 1 });
          }
          return Promise.resolve({ rowCount: 0 });
        }

        if (query.includes('DELETE FROM engraving_requests')) {
          mockRows.length = 0;
          return Promise.resolve({ rowCount: 0 });
        }

        if (query.includes('COUNT(*) as total')) {
          const total = mockRows.length;
          const pending = mockRows.filter(r => r.status === 'pending').length;
          const processing = mockRows.filter(r => r.status === 'processing').length;
          const completed = mockRows.filter(r => r.status === 'completed').length;
          const lastRequestTime = mockRows.length > 0 ? mockRows[mockRows.length - 1].timestamp : null;

          return Promise.resolve({
            rows: [{
              total: total.toString(),
              pending: pending.toString(),
              processing: processing.toString(),
              completed: completed.toString(),
              last_request_time: lastRequestTime
            }]
          });
        }

        if (query.includes('NOW() - INTERVAL')) {
          return Promise.resolve({ rows: [{ recent_count: mockRows.length.toString() }] });
        }

        if (query.includes('UPDATE engraving_requests SET') && query.includes('WHERE id = $')) {
          const id = params[params.length - 1];
          const found = mockRows.find(row => row.id === id);
          if (found) {
            // Update the found row with new values
            found.original_image = params[0];
            found.original_text = params[1];
            found.composed_image = params[2];
            found.custom_text = params[3];
            found.text_position_x = params[4];
            found.text_position_y = params[5];
            found.font = params[6];
            found.font_size = params[7];
            found.customer_name = params[8];
            found.customer_email = params[9];
            found.customer_phone = params[10];
            found.comments = params[11];
            found.status = 'pending';
            return Promise.resolve({ rows: [found], rowCount: 1 });
          }
          return Promise.resolve({ rowCount: 0 });
        }

        if (query.includes('customer_email = $1') && query.includes('custom_text = $2')) {
          const duplicates = mockRows.filter(row =>
            row.customer_email === params[0] &&
            row.custom_text === params[1]
          );
          return Promise.resolve({ rows: duplicates });
        }

        // Default response for metadata updates
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),

      // Reset mock data
      __resetMockData: () => {
        mockRows.length = 0;
        mockMetadata = {
          total_requests: 0,
          pending_count: 0,
          processing_count: 0,
          completed_count: 0,
          last_request_time: null
        };
      }
    }
  };
});

describe('RequestStorage (PostgreSQL) - Unit Tests', () => {
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

  beforeEach(() => {
    // Reset mock data before each test
    DatabaseConnection.__resetMockData();
    vi.clearAllMocks();
  });

  describe('storeRequest', () => {
    it('should store a valid request and return it with ID and timestamp', async () => {
      const result = await RequestStorage.storeRequest(validRequestData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.status).toBe('pending');
      expect(result.customText).toBe(validRequestData.customText);
      expect(result.customerInfo.name).toBe(validRequestData.customerInfo.name);
      expect(result.textPosition.x).toBe(validRequestData.textPosition.x);
      expect(result.textPosition.y).toBe(validRequestData.textPosition.y);
    });

    it('should throw error for missing originalImage', async () => {
      const invalidData = { ...validRequestData };
      delete invalidData.originalImage;

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('Validation failed: Either originalImage or originalText must be provided');
    });

    it('should throw error for missing customText', async () => {
      const invalidData = { ...validRequestData };
      delete invalidData.customText;

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('Validation failed: customText is required and must be a string');
    });

    it('should throw error for customText exceeding 100 characters', async () => {
      const invalidData = {
        ...validRequestData,
        customText: 'a'.repeat(101)
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('customText must not exceed 100 characters');
    });

    it('should throw error for invalid textPosition', async () => {
      const invalidData = {
        ...validRequestData,
        textPosition: { x: -1, y: 101 }
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('textPosition must be an object with x and y coordinates (0-100)');
    });

    it('should throw error for invalid fontSize', async () => {
      const invalidData = {
        ...validRequestData,
        fontSize: 5
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('fontSize must be a number between 12 and 72');
    });

    it('should throw error for missing customer name', async () => {
      const invalidData = {
        ...validRequestData,
        customerInfo: {
          ...validRequestData.customerInfo,
          name: ''
        }
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('customerInfo.name is required');
    });

    it('should throw error for invalid email', async () => {
      const invalidData = {
        ...validRequestData,
        customerInfo: {
          ...validRequestData.customerInfo,
          email: 'invalid-email'
        }
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('customerInfo.email is required and must be a valid email');
    });

    it('should throw error when storage limit is exceeded', async () => {
      // Mock the MAX_REQUESTS to a small number for testing
      const originalMax = RequestStorage.MAX_REQUESTS;
      RequestStorage.MAX_REQUESTS = 2;

      try {
        await RequestStorage.storeRequest(validRequestData);
        await RequestStorage.storeRequest({
          ...validRequestData,
          customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
        });

        await expect(RequestStorage.storeRequest({
          ...validRequestData,
          customerInfo: { ...validRequestData.customerInfo, email: 'test3@example.com' }
        })).rejects.toThrow('Storage limit exceeded');
      } finally {
        RequestStorage.MAX_REQUESTS = originalMax;
      }
    });

    it('should detect duplicate submissions within 5 minutes', async () => {
      await RequestStorage.storeRequest(validRequestData);

      await expect(RequestStorage.storeRequest(validRequestData))
        .rejects.toThrow('Duplicate request detected');
    });

    it('should allow same customer to submit different requests', async () => {
      await RequestStorage.storeRequest(validRequestData);

      const differentRequest = {
        ...validRequestData,
        customText: 'Different Text'
      };

      await expect(RequestStorage.storeRequest(differentRequest))
        .resolves.toBeTruthy();
    });

    it('should handle null composedImage correctly', async () => {
      const dataWithoutComposedImage = { ...validRequestData };
      delete dataWithoutComposedImage.composedImage;

      const result = await RequestStorage.storeRequest(dataWithoutComposedImage);
      expect(result.composedImage).toBeNull();
    });

    it('should handle optional phone field', async () => {
      const dataWithoutPhone = {
        ...validRequestData,
        customerInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        }
      };

      const result = await RequestStorage.storeRequest(dataWithoutPhone);
      expect(result.customerInfo.phone).toBeNull();
    });
  });

  describe('getAllRequests', () => {
    it('should return empty array when no requests stored', async () => {
      const requests = await RequestStorage.getAllRequests();
      expect(requests).toEqual([]);
    });

    it('should return all stored requests', async () => {
      const request1 = await RequestStorage.storeRequest(validRequestData);
      const request2 = await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      const requests = await RequestStorage.getAllRequests();
      expect(requests).toHaveLength(2);

      // Check that both requests are present (order might be different due to timestamp ordering)
      const requestIds = requests.map(r => r.id);
      expect(requestIds).toContain(request1.id);
      expect(requestIds).toContain(request2.id);
    });

    it('should return requests ordered by timestamp descending', async () => {
      // Add small delay to ensure different timestamps
      const request1 = await RequestStorage.storeRequest(validRequestData);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const request2 = await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      const requests = await RequestStorage.getAllRequests();
      expect(requests).toHaveLength(2);

      // Most recent should be first
      expect(requests[0].id).toBe(request2.id);
      expect(requests[1].id).toBe(request1.id);
    });
  });

  describe('getRequestById', () => {
    it('should return null for non-existent ID', async () => {
      const result = await RequestStorage.getRequestById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return the correct request for valid ID', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);

      expect(retrievedRequest).toEqual(storedRequest);
    });

    it('should return request with correct data types', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);
      const retrievedRequest = await RequestStorage.getRequestById(storedRequest.id);

      expect(typeof retrievedRequest.textPosition.x).toBe('number');
      expect(typeof retrievedRequest.textPosition.y).toBe('number');
      expect(typeof retrievedRequest.fontSize).toBe('number');
      expect(retrievedRequest.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getRequestStats', () => {
    it('should return correct statistics for empty storage', async () => {
      const stats = await RequestStorage.getRequestStats();

      expect(stats).toEqual({
        total: 0,
        recent: 0,
        byStatus: {
          pending: 0,
          processing: 0,
          completed: 0
        },
        lastRequestTime: null
      });
    });

    it('should return correct statistics after storing requests', async () => {
      const request1 = await RequestStorage.storeRequest(validRequestData);
      await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      const stats = await RequestStorage.getRequestStats();

      expect(stats.total).toBe(2);
      expect(stats.recent).toBe(2);
      expect(stats.byStatus.pending).toBe(2);
      expect(stats.byStatus.processing).toBe(0);
      expect(stats.byStatus.completed).toBe(0);
      expect(stats.lastRequestTime).toBeInstanceOf(Date);
    });

    it('should update statistics correctly after status changes', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);
      await RequestStorage.updateRequestStatus(request.id, 'processing');

      const stats = await RequestStorage.getRequestStats();

      expect(stats.total).toBe(1);
      expect(stats.byStatus.pending).toBe(0);
      expect(stats.byStatus.processing).toBe(1);
      expect(stats.byStatus.completed).toBe(0);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status successfully', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);
      const result = await RequestStorage.updateRequestStatus(request.id, 'processing');

      expect(result).toBe(true);

      const updatedRequest = await RequestStorage.getRequestById(request.id);
      expect(updatedRequest.status).toBe('processing');
    });

    it('should return false for non-existent request ID', async () => {
      const result = await RequestStorage.updateRequestStatus('non-existent', 'processing');
      expect(result).toBe(false);
    });

    it('should throw error for invalid status', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);

      await expect(RequestStorage.updateRequestStatus(request.id, 'invalid-status'))
        .rejects.toThrow('Invalid status. Must be: pending, processing, or completed');
    });

    it('should update status counts correctly', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);
      await RequestStorage.updateRequestStatus(request.id, 'completed');

      const stats = await RequestStorage.getRequestStats();
      expect(stats.byStatus.pending).toBe(0);
      expect(stats.byStatus.completed).toBe(1);
    });
  });

  describe('cancelRequest', () => {
    it('should successfully cancel an existing request', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);

      // Verify request exists
      expect(await RequestStorage.getRequestById(storedRequest.id)).toBeTruthy();
      expect((await RequestStorage.getRequestStats()).total).toBe(1);

      // Cancel the request
      const result = await RequestStorage.cancelRequest(storedRequest.id);

      expect(result).toBe(true);
      expect(await RequestStorage.getRequestById(storedRequest.id)).toBeNull();
      expect((await RequestStorage.getRequestStats()).total).toBe(0);
      expect((await RequestStorage.getRequestStats()).byStatus.pending).toBe(0);
    });

    it('should return false when trying to cancel non-existent request', async () => {
      const result = await RequestStorage.cancelRequest('non-existent-id');
      expect(result).toBe(false);
    });

    it('should update metadata correctly when canceling requests', async () => {
      const request1 = await RequestStorage.storeRequest(validRequestData);
      const request2 = await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      // Update one to processing
      await RequestStorage.updateRequestStatus(request2.id, 'processing');

      expect((await RequestStorage.getRequestStats()).total).toBe(2);
      expect((await RequestStorage.getRequestStats()).byStatus.pending).toBe(1);
      expect((await RequestStorage.getRequestStats()).byStatus.processing).toBe(1);

      // Cancel the pending request
      await RequestStorage.cancelRequest(request1.id);

      expect((await RequestStorage.getRequestStats()).total).toBe(1);
      expect((await RequestStorage.getRequestStats()).byStatus.pending).toBe(0);
      expect((await RequestStorage.getRequestStats()).byStatus.processing).toBe(1);
    });
  });

  describe('modifyRequest', () => {
    it('should successfully modify an existing request', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);

      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text',
        font: 'Georgia',
        fontSize: 32,
        comments: 'Updated comments'
      };

      const result = await RequestStorage.modifyRequest(storedRequest.id, updatedData);

      expect(result).toBeTruthy();
      expect(result.id).toBe(storedRequest.id);
      expect(result.timestamp).toEqual(storedRequest.timestamp);
      expect(result.customText).toBe('Modified Text');
      expect(result.font).toBe('Georgia');
      expect(result.fontSize).toBe(32);
      expect(result.comments).toBe('Updated comments');
      expect(result.status).toBe('pending'); // Should reset to pending
    });

    it('should return null when trying to modify non-existent request', async () => {
      const result = await RequestStorage.modifyRequest('non-existent-id', validRequestData);
      expect(result).toBeNull();
    });

    it('should validate updated data before modification', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);

      const invalidData = {
        ...validRequestData,
        customText: '', // Invalid - empty text
        customerInfo: {
          name: '',
          email: 'invalid-email'
        }
      };

      await expect(RequestStorage.modifyRequest(storedRequest.id, invalidData))
        .rejects.toThrow('Validation failed');
    });

    it('should reset status to pending when modified', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);

      // Update status to processing
      await RequestStorage.updateRequestStatus(storedRequest.id, 'processing');
      expect((await RequestStorage.getRequestById(storedRequest.id)).status).toBe('processing');

      // Modify the request
      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text'
      };

      const result = await RequestStorage.modifyRequest(storedRequest.id, updatedData);

      expect(result.status).toBe('pending');
      expect((await RequestStorage.getRequestStats()).byStatus.pending).toBe(1);
      expect((await RequestStorage.getRequestStats()).byStatus.processing).toBe(0);
    });

    it('should preserve original ID and timestamp when modifying', async () => {
      const storedRequest = await RequestStorage.storeRequest(validRequestData);

      const originalId = storedRequest.id;
      const originalTimestamp = storedRequest.timestamp;

      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text'
      };

      const result = await RequestStorage.modifyRequest(storedRequest.id, updatedData);

      expect(result.id).toBe(originalId);
      expect(result.timestamp).toEqual(originalTimestamp);
    });
  });

  describe('clearAll', () => {
    it('should clear all requests and reset metadata', async () => {
      await RequestStorage.storeRequest(validRequestData);
      await RequestStorage.storeRequest({
        ...validRequestData,
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' }
      });

      await RequestStorage.clearAll();

      const requests = await RequestStorage.getAllRequests();
      const stats = await RequestStorage.getRequestStats();

      expect(requests).toHaveLength(0);
      expect(stats.total).toBe(0);
      expect(stats.byStatus.pending).toBe(0);
    });
  });

  describe('data validation edge cases', () => {
    it('should handle optional comments field', async () => {
      const dataWithoutComments = { ...validRequestData };
      delete dataWithoutComments.comments;

      const result = await RequestStorage.storeRequest(dataWithoutComments);
      expect(result.comments).toBe('');
    });

    it('should handle optional phone field', async () => {
      const dataWithoutPhone = {
        ...validRequestData,
        customerInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        }
      };

      const result = await RequestStorage.storeRequest(dataWithoutPhone);
      expect(result.customerInfo.phone).toBeNull();
    });

    it('should validate comments length', async () => {
      const invalidData = {
        ...validRequestData,
        comments: 'a'.repeat(501)
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('comments must be a string with maximum 500 characters');
    });

    it('should validate phone length', async () => {
      const invalidData = {
        ...validRequestData,
        customerInfo: {
          ...validRequestData.customerInfo,
          phone: '1'.repeat(21)
        }
      };

      await expect(RequestStorage.storeRequest(invalidData))
        .rejects.toThrow('customerInfo.phone must be a string with maximum 20 characters');
    });
  });

  describe('database integration', () => {
    it('should persist data across service calls', async () => {
      const request = await RequestStorage.storeRequest(validRequestData);

      // Simulate service restart by getting fresh data
      const retrievedRequest = await RequestStorage.getRequestById(request.id);
      const allRequests = await RequestStorage.getAllRequests();

      expect(retrievedRequest).toEqual(request);
      expect(allRequests).toHaveLength(1);
      expect(allRequests[0]).toEqual(request);
    });

    it('should handle concurrent operations correctly', async () => {
      const requests = await Promise.all([
        RequestStorage.storeRequest({
          ...validRequestData,
          customerInfo: { ...validRequestData.customerInfo, email: 'user1@example.com' }
        }),
        RequestStorage.storeRequest({
          ...validRequestData,
          customerInfo: { ...validRequestData.customerInfo, email: 'user2@example.com' }
        }),
        RequestStorage.storeRequest({
          ...validRequestData,
          customerInfo: { ...validRequestData.customerInfo, email: 'user3@example.com' }
        })
      ]);

      expect(requests).toHaveLength(3);

      const allRequests = await RequestStorage.getAllRequests();
      expect(allRequests).toHaveLength(3);

      const stats = await RequestStorage.getRequestStats();
      expect(stats.total).toBe(3);
      expect(stats.byStatus.pending).toBe(3);
    });
  });
});