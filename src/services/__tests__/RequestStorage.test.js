import { describe, it, expect, beforeEach, vi } from 'vitest';
import RequestStorage from '../RequestStorage.js';

describe('RequestStorage', () => {
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
    // Clear storage before each test
    RequestStorage.clearAll();
  });

  describe('storeRequest', () => {
    it('should store a valid request and return it with ID and timestamp', () => {
      const result = RequestStorage.storeRequest(validRequestData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.status).toBe('pending');
      expect(result.customText).toBe(validRequestData.customText);
      expect(result.customerInfo.name).toBe(validRequestData.customerInfo.name);
    });

    it('should throw error for missing originalImage', () => {
      const invalidData = { ...validRequestData };
      delete invalidData.originalImage;
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('Validation failed: originalImage is required and must be a string');
    });

    it('should throw error for missing customText', () => {
      const invalidData = { ...validRequestData };
      delete invalidData.customText;
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('Validation failed: customText is required and must be a string');
    });

    it('should throw error for customText exceeding 100 characters', () => {
      const invalidData = { 
        ...validRequestData, 
        customText: 'a'.repeat(101) 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('customText must not exceed 100 characters');
    });

    it('should throw error for invalid textPosition', () => {
      const invalidData = { 
        ...validRequestData, 
        textPosition: { x: -1, y: 101 } 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('textPosition must be an object with x and y coordinates (0-100)');
    });

    it('should throw error for invalid fontSize', () => {
      const invalidData = { 
        ...validRequestData, 
        fontSize: 5 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('fontSize must be a number between 12 and 72');
    });

    it('should throw error for missing customer name', () => {
      const invalidData = { 
        ...validRequestData, 
        customerInfo: { 
          ...validRequestData.customerInfo, 
          name: '' 
        } 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('customerInfo.name is required');
    });

    it('should throw error for invalid email', () => {
      const invalidData = { 
        ...validRequestData, 
        customerInfo: { 
          ...validRequestData.customerInfo, 
          email: 'invalid-email' 
        } 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('customerInfo.email is required and must be a valid email');
    });

    it('should throw error when storage limit is exceeded', () => {
      // Mock the MAX_REQUESTS to a small number for testing
      const originalMax = RequestStorage.MAX_REQUESTS;
      RequestStorage.MAX_REQUESTS = 2;
      
      try {
        RequestStorage.storeRequest(validRequestData);
        RequestStorage.storeRequest({ 
          ...validRequestData, 
          customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' } 
        });
        
        expect(() => RequestStorage.storeRequest({ 
          ...validRequestData, 
          customerInfo: { ...validRequestData.customerInfo, email: 'test3@example.com' } 
        })).toThrow('Storage limit exceeded');
      } finally {
        RequestStorage.MAX_REQUESTS = originalMax;
      }
    });

    it('should detect duplicate submissions within 5 minutes', () => {
      RequestStorage.storeRequest(validRequestData);
      
      expect(() => RequestStorage.storeRequest(validRequestData))
        .toThrow('Duplicate request detected');
    });

    it('should allow same customer to submit different requests', () => {
      RequestStorage.storeRequest(validRequestData);
      
      const differentRequest = { 
        ...validRequestData, 
        customText: 'Different Text' 
      };
      
      expect(() => RequestStorage.storeRequest(differentRequest))
        .not.toThrow();
    });
  });

  describe('getAllRequests', () => {
    it('should return empty array when no requests stored', () => {
      const requests = RequestStorage.getAllRequests();
      expect(requests).toEqual([]);
    });

    it('should return all stored requests', () => {
      const request1 = RequestStorage.storeRequest(validRequestData);
      const request2 = RequestStorage.storeRequest({ 
        ...validRequestData, 
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' } 
      });
      
      const requests = RequestStorage.getAllRequests();
      expect(requests).toHaveLength(2);
      expect(requests).toContainEqual(request1);
      expect(requests).toContainEqual(request2);
    });
  });

  describe('getRequestById', () => {
    it('should return null for non-existent ID', () => {
      const result = RequestStorage.getRequestById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return the correct request for valid ID', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      const retrievedRequest = RequestStorage.getRequestById(storedRequest.id);
      
      expect(retrievedRequest).toEqual(storedRequest);
    });
  });

  describe('getRequestStats', () => {
    it('should return correct statistics for empty storage', () => {
      const stats = RequestStorage.getRequestStats();
      
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

    it('should return correct statistics after storing requests', () => {
      const request1 = RequestStorage.storeRequest(validRequestData);
      RequestStorage.storeRequest({ 
        ...validRequestData, 
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' } 
      });
      
      const stats = RequestStorage.getRequestStats();
      
      expect(stats.total).toBe(2);
      expect(stats.recent).toBe(2);
      expect(stats.byStatus.pending).toBe(2);
      expect(stats.lastRequestTime).toBeInstanceOf(Date);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status successfully', () => {
      const request = RequestStorage.storeRequest(validRequestData);
      const result = RequestStorage.updateRequestStatus(request.id, 'processing');
      
      expect(result).toBe(true);
      
      const updatedRequest = RequestStorage.getRequestById(request.id);
      expect(updatedRequest.status).toBe('processing');
    });

    it('should return false for non-existent request ID', () => {
      const result = RequestStorage.updateRequestStatus('non-existent', 'processing');
      expect(result).toBe(false);
    });

    it('should throw error for invalid status', () => {
      const request = RequestStorage.storeRequest(validRequestData);
      
      expect(() => RequestStorage.updateRequestStatus(request.id, 'invalid-status'))
        .toThrow('Invalid status. Must be: pending, processing, or completed');
    });

    it('should update status counts correctly', () => {
      const request = RequestStorage.storeRequest(validRequestData);
      RequestStorage.updateRequestStatus(request.id, 'completed');
      
      const stats = RequestStorage.getRequestStats();
      expect(stats.byStatus.pending).toBe(0);
      expect(stats.byStatus.completed).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all requests and reset metadata', () => {
      RequestStorage.storeRequest(validRequestData);
      RequestStorage.storeRequest({ 
        ...validRequestData, 
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' } 
      });
      
      RequestStorage.clearAll();
      
      const requests = RequestStorage.getAllRequests();
      const stats = RequestStorage.getRequestStats();
      
      expect(requests).toHaveLength(0);
      expect(stats.total).toBe(0);
      expect(stats.byStatus.pending).toBe(0);
    });
  });

  describe('cancelRequest', () => {
    it('should successfully cancel an existing request', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      
      // Verify request exists
      expect(RequestStorage.getRequestById(storedRequest.id)).toBeTruthy();
      expect(RequestStorage.getRequestStats().total).toBe(1);
      
      // Cancel the request
      const result = RequestStorage.cancelRequest(storedRequest.id);
      
      expect(result).toBe(true);
      expect(RequestStorage.getRequestById(storedRequest.id)).toBeNull();
      expect(RequestStorage.getRequestStats().total).toBe(0);
      expect(RequestStorage.getRequestStats().byStatus.pending).toBe(0);
    });

    it('should return false when trying to cancel non-existent request', () => {
      const result = RequestStorage.cancelRequest('non-existent-id');
      expect(result).toBe(false);
    });

    it('should update metadata correctly when canceling requests', () => {
      const request1 = RequestStorage.storeRequest(validRequestData);
      const request2 = RequestStorage.storeRequest({ 
        ...validRequestData, 
        customerInfo: { ...validRequestData.customerInfo, email: 'test2@example.com' } 
      });
      
      // Update one to processing
      RequestStorage.updateRequestStatus(request2.id, 'processing');
      
      expect(RequestStorage.getRequestStats().total).toBe(2);
      expect(RequestStorage.getRequestStats().byStatus.pending).toBe(1);
      expect(RequestStorage.getRequestStats().byStatus.processing).toBe(1);
      
      // Cancel the pending request
      RequestStorage.cancelRequest(request1.id);
      
      expect(RequestStorage.getRequestStats().total).toBe(1);
      expect(RequestStorage.getRequestStats().byStatus.pending).toBe(0);
      expect(RequestStorage.getRequestStats().byStatus.processing).toBe(1);
    });
  });

  describe('modifyRequest', () => {
    it('should successfully modify an existing request', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      
      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text',
        font: 'Georgia',
        fontSize: 32,
        comments: 'Updated comments'
      };
      
      const result = RequestStorage.modifyRequest(storedRequest.id, updatedData);
      
      expect(result).toBeTruthy();
      expect(result.id).toBe(storedRequest.id);
      expect(result.timestamp).toEqual(storedRequest.timestamp);
      expect(result.customText).toBe('Modified Text');
      expect(result.font).toBe('Georgia');
      expect(result.fontSize).toBe(32);
      expect(result.comments).toBe('Updated comments');
      expect(result.status).toBe('pending'); // Should reset to pending
    });

    it('should return null when trying to modify non-existent request', () => {
      const result = RequestStorage.modifyRequest('non-existent-id', validRequestData);
      expect(result).toBeNull();
    });

    it('should validate updated data before modification', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      
      const invalidData = {
        ...validRequestData,
        customText: '', // Invalid - empty text
        customerInfo: {
          name: '',
          email: 'invalid-email'
        }
      };
      
      expect(() => {
        RequestStorage.modifyRequest(storedRequest.id, invalidData);
      }).toThrow('Validation failed');
    });

    it('should reset status to pending when modified', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      
      // Update status to processing
      RequestStorage.updateRequestStatus(storedRequest.id, 'processing');
      expect(RequestStorage.getRequestById(storedRequest.id).status).toBe('processing');
      
      // Modify the request
      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text'
      };
      
      const result = RequestStorage.modifyRequest(storedRequest.id, updatedData);
      
      expect(result.status).toBe('pending');
      expect(RequestStorage.getRequestStats().byStatus.pending).toBe(1);
      expect(RequestStorage.getRequestStats().byStatus.processing).toBe(0);
    });

    it('should preserve original ID and timestamp when modifying', () => {
      const storedRequest = RequestStorage.storeRequest(validRequestData);
      
      const originalId = storedRequest.id;
      const originalTimestamp = storedRequest.timestamp;
      
      const updatedData = {
        ...validRequestData,
        customText: 'Modified Text'
      };
      
      const result = RequestStorage.modifyRequest(storedRequest.id, updatedData);
      
      expect(result.id).toBe(originalId);
      expect(result.timestamp).toEqual(originalTimestamp);
    });
  });

  describe('data validation edge cases', () => {
    it('should handle optional comments field', () => {
      const dataWithoutComments = { ...validRequestData };
      delete dataWithoutComments.comments;
      
      const result = RequestStorage.storeRequest(dataWithoutComments);
      expect(result.comments).toBe('');
    });

    it('should handle optional phone field', () => {
      const dataWithoutPhone = { 
        ...validRequestData,
        customerInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        }
      };
      
      const result = RequestStorage.storeRequest(dataWithoutPhone);
      expect(result.customerInfo.phone).toBeUndefined();
    });

    it('should validate comments length', () => {
      const invalidData = { 
        ...validRequestData, 
        comments: 'a'.repeat(501) 
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('comments must be a string with maximum 500 characters');
    });

    it('should validate phone length', () => {
      const invalidData = { 
        ...validRequestData,
        customerInfo: {
          ...validRequestData.customerInfo,
          phone: '1'.repeat(21)
        }
      };
      
      expect(() => RequestStorage.storeRequest(invalidData))
        .toThrow('customerInfo.phone must be a string with maximum 20 characters');
    });
  });
});