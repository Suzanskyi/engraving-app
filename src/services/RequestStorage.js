import { generateUUID } from '../utils/uuid.js';
import { validateAndSanitizeRequest } from '../utils/validation.js';

/**
 * RequestStorage - In-memory storage service for engraving requests
 * Manages storage, retrieval, and validation of engraving requests
 */
class RequestStorage {
  // Static storage using Map for O(1) lookups
  static #requests = new Map();
  static #metadata = {
    totalRequests: 0,
    lastRequestTime: null,
    requestsByStatus: {
      pending: 0,
      processing: 0,
      completed: 0
    }
  };

  // Maximum number of requests to prevent memory issues
  static MAX_REQUESTS = 1000;
  
  // Duplicate prevention window (5 minutes)
  static DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

  /**
   * Store a new engraving request
   * @param {Object} requestData - The request data to store
   * @returns {Object} - Stored request with generated ID and timestamp
   * @throws {Error} - If validation fails or storage limit exceeded
   */
  static storeRequest(requestData) {
    // Validate and sanitize request data
    const validation = validateAndSanitizeRequest(requestData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedData = validation.sanitizedData;
    
    // Check storage limit
    if (this.#requests.size >= this.MAX_REQUESTS) {
      throw new Error(`Storage limit exceeded. Maximum ${this.MAX_REQUESTS} requests allowed.`);
    }
    
    // Check for duplicate submissions
    this.#checkForDuplicates(sanitizedData);
    
    // Generate unique ID and timestamp
    const id = generateUUID();
    const timestamp = new Date();
    
    // Create complete request object
    const request = {
      id,
      timestamp,
      originalImage: sanitizedData.originalImage,
      composedImage: sanitizedData.composedImage || null,
      customText: sanitizedData.customText,
      textPosition: { ...sanitizedData.textPosition },
      font: sanitizedData.font,
      fontSize: sanitizedData.fontSize,
      customerInfo: { ...sanitizedData.customerInfo },
      comments: sanitizedData.comments || '',
      status: 'pending'
    };
    
    // Store the request
    this.#requests.set(id, request);
    
    // Update metadata
    this.#updateMetadata(request);
    
    return request;
  }

  /**
   * Retrieve all stored requests
   * @returns {Array} - Array of all stored requests
   */
  static getAllRequests() {
    return Array.from(this.#requests.values());
  }

  /**
   * Retrieve a specific request by ID
   * @param {string} id - The request ID
   * @returns {Object|null} - The request object or null if not found
   */
  static getRequestById(id) {
    return this.#requests.get(id) || null;
  }

  /**
   * Get request statistics
   * @returns {Object} - Statistics about stored requests
   */
  static getRequestStats() {
    return {
      total: this.#metadata.totalRequests,
      recent: this.#getRecentRequestCount(),
      byStatus: { ...this.#metadata.requestsByStatus },
      lastRequestTime: this.#metadata.lastRequestTime
    };
  }

  /**
   * Update request status
   * @param {string} id - Request ID
   * @param {string} status - New status (pending, processing, completed)
   * @returns {boolean} - True if updated successfully
   */
  static updateRequestStatus(id, status) {
    const request = this.#requests.get(id);
    if (!request) {
      return false;
    }
    
    if (!['pending', 'processing', 'completed'].includes(status)) {
      throw new Error('Invalid status. Must be: pending, processing, or completed');
    }
    
    // Update status counts
    this.#metadata.requestsByStatus[request.status]--;
    this.#metadata.requestsByStatus[status]++;
    
    // Update request
    request.status = status;
    
    return true;
  }

  /**
   * Cancel a request (removes it from storage)
   * @param {string} id - Request ID to cancel
   * @returns {boolean} - True if cancelled successfully
   */
  static cancelRequest(id) {
    const request = this.#requests.get(id);
    if (!request) {
      return false;
    }
    
    // Update metadata
    this.#metadata.requestsByStatus[request.status]--;
    this.#metadata.totalRequests--;
    
    // Remove request
    this.#requests.delete(id);
    
    return true;
  }

  /**
   * Modify an existing request
   * @param {string} id - Request ID to modify
   * @param {Object} updatedData - Updated request data
   * @returns {Object|null} - Updated request or null if not found
   */
  static modifyRequest(id, updatedData) {
    const existingRequest = this.#requests.get(id);
    if (!existingRequest) {
      return null;
    }
    
    // Validate updated data
    const validation = validateAndSanitizeRequest(updatedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedData = validation.sanitizedData;
    
    // Create updated request (keep original ID and timestamp)
    const updatedRequest = {
      ...existingRequest,
      originalImage: sanitizedData.originalImage,
      composedImage: sanitizedData.composedImage || null,
      customText: sanitizedData.customText,
      textPosition: { ...sanitizedData.textPosition },
      font: sanitizedData.font,
      fontSize: sanitizedData.fontSize,
      customerInfo: { ...sanitizedData.customerInfo },
      comments: sanitizedData.comments || '',
      status: 'pending' // Reset to pending when modified
    };
    
    // Update status counts if status changed
    if (existingRequest.status !== updatedRequest.status) {
      this.#metadata.requestsByStatus[existingRequest.status]--;
      this.#metadata.requestsByStatus[updatedRequest.status]++;
    }
    
    // Store updated request
    this.#requests.set(id, updatedRequest);
    
    return updatedRequest;
  }

  /**
   * Clear all stored requests (for testing purposes)
   */
  static clearAll() {
    this.#requests.clear();
    this.#metadata = {
      totalRequests: 0,
      lastRequestTime: null,
      requestsByStatus: {
        pending: 0,
        processing: 0,
        completed: 0
      }
    };
  }



  /**
   * Check for duplicate submissions within the time window
   * @private
   */
  static #checkForDuplicates(requestData) {
    const now = Date.now();
    const cutoff = now - this.DUPLICATE_WINDOW_MS;
    
    for (const request of this.#requests.values()) {
      if (request.timestamp.getTime() > cutoff) {
        // Check if this looks like a duplicate
        if (request.customerInfo.email === requestData.customerInfo.email &&
            request.customText === requestData.customText) {
          throw new Error('Duplicate request detected. Please wait 5 minutes before resubmitting.');
        }
      }
    }
  }

  /**
   * Update metadata after storing a request
   * @private
   */
  static #updateMetadata(request) {
    this.#metadata.totalRequests++;
    this.#metadata.lastRequestTime = request.timestamp;
    this.#metadata.requestsByStatus[request.status]++;
  }

  /**
   * Get count of requests in the last 24 hours
   * @private
   */
  static #getRecentRequestCount() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return Array.from(this.#requests.values())
      .filter(request => request.timestamp.getTime() > oneDayAgo)
      .length;
  }


}

export default RequestStorage;