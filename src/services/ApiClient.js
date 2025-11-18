/**
 * API Client for communicating with the backend server
 * Provides the same interface as RequestStorage but makes HTTP requests
 */

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request failed: ${config.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  /**
   * Store a new engraving request
   * @param {Object} requestData - The request data to store
   * @returns {Promise<Object>} - Stored request with generated ID and timestamp
   */
  async storeRequest(requestData) {
    return await this.request('/requests', {
      method: 'POST',
      body: requestData,
    });
  }

  /**
   * Retrieve all stored requests
   * @returns {Promise<Array>} - Array of all stored requests
   */
  async getAllRequests() {
    return await this.request('/requests');
  }

  /**
   * Retrieve a specific request by ID
   * @param {string} id - The request ID
   * @returns {Promise<Object|null>} - The request object or null if not found
   */
  async getRequestById(id) {
    try {
      return await this.request(`/requests/${id}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get request statistics
   * @returns {Promise<Object>} - Statistics about stored requests
   */
  async getRequestStats() {
    return await this.request('/requests/stats');
  }

  /**
   * Update request status
   * @param {string} id - Request ID
   * @param {string} status - New status (pending, processing, completed)
   * @returns {Promise<boolean>} - True if updated successfully
   */
  async updateRequestStatus(id, status) {
    const result = await this.request(`/requests/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
    return result.success;
  }

  /**
   * Cancel a request (removes it from storage)
   * @param {string} id - Request ID to cancel
   * @returns {Promise<boolean>} - True if cancelled successfully
   */
  async cancelRequest(id) {
    const result = await this.request(`/requests/${id}`, {
      method: 'DELETE',
    });
    return result.success;
  }

  /**
   * Modify an existing request
   * @param {string} id - Request ID to modify
   * @param {Object} updatedData - Updated request data
   * @returns {Promise<Object|null>} - Updated request or null if not found
   */
  async modifyRequest(id, updatedData) {
    try {
      return await this.request(`/requests/${id}`, {
        method: 'PUT',
        body: updatedData,
      });
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Clear all stored requests (for testing purposes)
   */
  async clearAll() {
    // This would need to be implemented on the backend if needed
    throw new Error('clearAll not implemented in API client');
  }

  /**
   * Check server health
   * @returns {Promise<Object>} - Server health status
   */
  async getHealth() {
    return await this.request('/health');
  }
}

export default ApiClient;