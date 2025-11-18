/**
 * Database connection management service for PostgreSQL
 * Provides connection pooling, query execution, and transaction support
 */

import pkg from 'pg';
const { Pool } = pkg;
import { getDatabaseConfig, validateDatabaseConfig } from '../config/database.js';

/**
 * DatabaseConnection class manages PostgreSQL connections with pooling
 */
class DatabaseConnection {
  static pool = null;
  static isInitialized = false;

  /**
   * Initialize the database connection pool
   * @param {Object} config - Optional database configuration override
   * @throws {Error} If initialization fails
   */
  static async initialize(config = null) {
    try {
      // Use provided config or get from environment
      const dbConfig = config || getDatabaseConfig();
      
      // Validate configuration
      validateDatabaseConfig(dbConfig);
      
      // Create connection pool
      this.pool = new Pool(dbConfig);
      
      // Test initial connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isInitialized = true;
      
      // Handle pool errors
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
      
      console.log('Database connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error.message);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Execute a parameterized query
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   * @throws {Error} If query execution fails
   */
  static async query(text, params = []) {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Database connection not initialized. Call initialize() first.');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      
      // Transform common PostgreSQL errors to user-friendly messages
      if (error.code === '23505') {
        throw new Error('Duplicate entry: A record with this information already exists');
      } else if (error.code === '23503') {
        throw new Error('Invalid reference: Referenced record does not exist');
      } else if (error.code === '23514') {
        throw new Error('Invalid data: Data violates database constraints');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Database connection refused: Please check if PostgreSQL is running');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Database host not found: Please check database configuration');
      }
      
      throw new Error(`Database query failed: ${error.message}`);
    }
  }  /**

   * Execute multiple queries within a transaction
   * @param {Function} callback - Function that receives client and executes queries
   * @returns {Promise<any>} Result from callback function
   * @throws {Error} If transaction fails
   */
  static async transaction(callback) {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Database connection not initialized. Call initialize() first.');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute callback with client
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
      console.error('Transaction rolled back due to error:', error.message);
      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get connection pool statistics
   * @returns {Object} Pool statistics
   */
  static getPoolStats() {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }
    
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Check if database connection is healthy
   * @returns {Promise<boolean>} True if connection is healthy
   */
  static async isHealthy() {
    try {
      if (!this.isInitialized || !this.pool) {
        return false;
      }
      
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length === 1 && result.rows[0].health_check === 1;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Close the database connection pool gracefully
   * @returns {Promise<void>}
   */
  static async close() {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.isInitialized = false;
        console.log('Database connection pool closed successfully');
      } catch (error) {
        console.error('Error closing database connection pool:', error.message);
        throw new Error(`Failed to close database connection: ${error.message}`);
      }
    }
  }

  /**
   * Execute a query with retry logic for transient failures
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} baseDelay - Base delay in milliseconds for exponential backoff
   * @returns {Promise<Object>} Query result
   */
  static async queryWithRetry(text, params = [], maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.query(text, params);
      } catch (error) {
        lastError = error;
        
        // Don't retry for non-transient errors (constraint violations)
        if (error.message.includes('Duplicate entry') || 
            error.message.includes('Invalid reference') || 
            error.message.includes('Invalid data')) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Query attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

export default DatabaseConnection;