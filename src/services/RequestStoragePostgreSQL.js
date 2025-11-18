import { generateUUID } from '../utils/uuid.js';
import { validateAndSanitizeRequest } from '../utils/validation.js';
import DatabaseConnection from './DatabaseConnection.js';

/**
 * RequestStorage - PostgreSQL-backed storage service for engraving requests
 * Manages storage, retrieval, and validation of engraving requests using PostgreSQL
 */
class RequestStorage {
  // Maximum number of requests to prevent storage issues
  static MAX_REQUESTS = 1000;
  
  // Duplicate prevention window (5 minutes)
  static DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

  /**
   * Store a new engraving request
   * @param {Object} requestData - The request data to store
   * @returns {Promise<Object>} - Stored request with generated ID and timestamp
   * @throws {Error} - If validation fails or storage limit exceeded
   */
  static async storeRequest(requestData) {
    // Validate and sanitize request data
    const validation = validateAndSanitizeRequest(requestData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedData = validation.sanitizedData;
    
    // Check storage limit
    const countResult = await DatabaseConnection.query('SELECT COUNT(*) as count FROM engraving_requests');
    const currentCount = parseInt(countResult.rows[0].count);
    
    if (currentCount >= this.MAX_REQUESTS) {
      throw new Error(`Storage limit exceeded. Maximum ${this.MAX_REQUESTS} requests allowed.`);
    }
    
    // Check for duplicate submissions
    await this.#checkForDuplicates(sanitizedData);
    
    // Generate unique ID and timestamp
    const id = generateUUID();
    const timestamp = new Date();
    
    // Insert request into database
    const insertQuery = `
      INSERT INTO engraving_requests (
        id, timestamp, original_image, original_text, composed_image, custom_text,
        text_position_x, text_position_y, font, font_size,
        customer_name, customer_email, customer_phone, comments, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      id,
      timestamp,
      sanitizedData.originalImage || null,
      sanitizedData.originalText || null,
      sanitizedData.composedImage || null,
      sanitizedData.customText,
      sanitizedData.textPosition.x,
      sanitizedData.textPosition.y,
      sanitizedData.font,
      sanitizedData.fontSize,
      sanitizedData.customerInfo.name,
      sanitizedData.customerInfo.email,
      sanitizedData.customerInfo.phone || null,
      sanitizedData.comments || '',
      'pending'
    ];
    
    const result = await DatabaseConnection.query(insertQuery, values);
    const dbRow = result.rows[0];
    
    // Update metadata
    await this.#updateMetadata('insert', null, 'pending');
    
    // Transform database row to expected format
    return this.#transformDbRowToRequest(dbRow);
  }

  /**
   * Retrieve all stored requests
   * @returns {Promise<Array>} - Array of all stored requests
   */
  static async getAllRequests() {
    const query = 'SELECT * FROM engraving_requests ORDER BY timestamp DESC';
    const result = await DatabaseConnection.query(query);
    
    return result.rows.map(row => this.#transformDbRowToRequest(row));
  }

  /**
   * Retrieve a specific request by ID
   * @param {string} id - The request ID
   * @returns {Promise<Object|null>} - The request object or null if not found
   */
  static async getRequestById(id) {
    const query = 'SELECT * FROM engraving_requests WHERE id = $1';
    const result = await DatabaseConnection.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.#transformDbRowToRequest(result.rows[0]);
  }

  /**
   * Get request statistics
   * @returns {Promise<Object>} - Statistics about stored requests
   */
  static async getRequestStats() {
    // Get total count and status counts
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        MAX(timestamp) as last_request_time
      FROM engraving_requests
    `;
    
    const statsResult = await DatabaseConnection.query(statsQuery);
    const stats = statsResult.rows[0];
    
    // Get recent count (last 24 hours)
    const recentQuery = `
      SELECT COUNT(*) as recent_count 
      FROM engraving_requests 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `;
    
    const recentResult = await DatabaseConnection.query(recentQuery);
    const recentCount = parseInt(recentResult.rows[0].recent_count);
    
    return {
      total: parseInt(stats.total),
      recent: recentCount,
      byStatus: {
        pending: parseInt(stats.pending),
        processing: parseInt(stats.processing),
        completed: parseInt(stats.completed)
      },
      lastRequestTime: stats.last_request_time
    };
  }

  /**
   * Update request status
   * @param {string} id - Request ID
   * @param {string} status - New status (pending, processing, completed)
   * @returns {Promise<boolean>} - True if updated successfully
   */
  static async updateRequestStatus(id, status) {
    if (!['pending', 'processing', 'completed'].includes(status)) {
      throw new Error('Invalid status. Must be: pending, processing, or completed');
    }
    
    // Get current status for metadata update
    const currentRequest = await this.getRequestById(id);
    if (!currentRequest) {
      return false;
    }
    
    // Update status in database
    const updateQuery = 'UPDATE engraving_requests SET status = $1 WHERE id = $2';
    const result = await DatabaseConnection.query(updateQuery, [status, id]);
    
    if (result.rowCount === 0) {
      return false;
    }
    
    // Update metadata
    await this.#updateMetadata('status_change', currentRequest.status, status);
    
    return true;
  }

  /**
   * Cancel a request (removes it from storage)
   * @param {string} id - Request ID to cancel
   * @returns {Promise<boolean>} - True if cancelled successfully
   */
  static async cancelRequest(id) {
    // Get current request for metadata update
    const currentRequest = await this.getRequestById(id);
    if (!currentRequest) {
      return false;
    }
    
    // Delete request from database
    const deleteQuery = 'DELETE FROM engraving_requests WHERE id = $1';
    const result = await DatabaseConnection.query(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return false;
    }
    
    // Update metadata
    await this.#updateMetadata('delete', currentRequest.status, null);
    
    return true;
  }

  /**
   * Modify an existing request
   * @param {string} id - Request ID to modify
   * @param {Object} updatedData - Updated request data
   * @returns {Promise<Object|null>} - Updated request or null if not found
   */
  static async modifyRequest(id, updatedData) {
    // Check if request exists
    const existingRequest = await this.getRequestById(id);
    if (!existingRequest) {
      return null;
    }
    
    // Validate updated data
    const validation = validateAndSanitizeRequest(updatedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedData = validation.sanitizedData;
    
    // Update request in database (reset status to pending)
    const updateQuery = `
      UPDATE engraving_requests SET
        original_image = $1,
        original_text = $2,
        composed_image = $3,
        custom_text = $4,
        text_position_x = $5,
        text_position_y = $6,
        font = $7,
        font_size = $8,
        customer_name = $9,
        customer_email = $10,
        customer_phone = $11,
        comments = $12,
        status = 'pending'
      WHERE id = $13
      RETURNING *
    `;
    
    const values = [
      sanitizedData.originalImage || null,
      sanitizedData.originalText || null,
      sanitizedData.composedImage || null,
      sanitizedData.customText,
      sanitizedData.textPosition.x,
      sanitizedData.textPosition.y,
      sanitizedData.font,
      sanitizedData.fontSize,
      sanitizedData.customerInfo.name,
      sanitizedData.customerInfo.email,
      sanitizedData.customerInfo.phone || null,
      sanitizedData.comments || '',
      id
    ];
    
    const result = await DatabaseConnection.query(updateQuery, values);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    // Update metadata if status changed
    if (existingRequest.status !== 'pending') {
      await this.#updateMetadata('status_change', existingRequest.status, 'pending');
    }
    
    return this.#transformDbRowToRequest(result.rows[0]);
  }

  /**
   * Clear all stored requests (for testing purposes)
   */
  static async clearAll() {
    await DatabaseConnection.query('DELETE FROM engraving_requests');
    await DatabaseConnection.query(`
      UPDATE request_metadata SET 
        total_requests = 0,
        last_request_time = NULL,
        pending_count = 0,
        processing_count = 0,
        completed_count = 0
      WHERE id = 1
    `);
  }

  /**
   * Check for duplicate submissions within the time window
   * @private
   */
  static async #checkForDuplicates(requestData) {
    const cutoffTime = new Date(Date.now() - this.DUPLICATE_WINDOW_MS);
    
    const duplicateQuery = `
      SELECT id FROM engraving_requests 
      WHERE customer_email = $1 
        AND custom_text = $2 
        AND timestamp > $3
      LIMIT 1
    `;
    
    const result = await DatabaseConnection.query(duplicateQuery, [
      requestData.customerInfo.email,
      requestData.customText,
      cutoffTime
    ]);
    
    if (result.rows.length > 0) {
      throw new Error('Duplicate request detected. Please wait 5 minutes before resubmitting.');
    }
  }

  /**
   * Update metadata after database operations
   * @private
   */
  static async #updateMetadata(operation, oldStatus, newStatus) {
    let updateQuery;
    let values;
    
    switch (operation) {
      case 'insert':
        updateQuery = `
          UPDATE request_metadata SET
            total_requests = total_requests + 1,
            last_request_time = NOW(),
            pending_count = pending_count + 1
          WHERE id = 1
        `;
        values = [];
        break;
        
      case 'delete':
        const deleteField = `${oldStatus}_count`;
        updateQuery = `
          UPDATE request_metadata SET
            total_requests = total_requests - 1,
            ${deleteField} = ${deleteField} - 1
          WHERE id = 1
        `;
        values = [];
        break;
        
      case 'status_change':
        const oldField = `${oldStatus}_count`;
        const newField = `${newStatus}_count`;
        updateQuery = `
          UPDATE request_metadata SET
            ${oldField} = ${oldField} - 1,
            ${newField} = ${newField} + 1
          WHERE id = 1
        `;
        values = [];
        break;
    }
    
    if (updateQuery) {
      await DatabaseConnection.query(updateQuery, values);
    }
  }

  /**
   * Transform database row to request object format
   * @private
   */
  static #transformDbRowToRequest(dbRow) {
    return {
      id: dbRow.id,
      timestamp: dbRow.timestamp,
      originalImage: dbRow.original_image,
      originalText: dbRow.original_text,
      composedImage: dbRow.composed_image,
      customText: dbRow.custom_text,
      textPosition: {
        x: parseFloat(dbRow.text_position_x),
        y: parseFloat(dbRow.text_position_y)
      },
      font: dbRow.font,
      fontSize: dbRow.font_size,
      customerInfo: {
        name: dbRow.customer_name,
        email: dbRow.customer_email,
        phone: dbRow.customer_phone
      },
      comments: dbRow.comments || '',
      status: dbRow.status
    };
  }
}

export default RequestStorage;