/**
 * Database Initializer Service
 * Handles database connection initialization and schema setup during application startup
 */

import DatabaseConnection from './DatabaseConnection.js';
import { createSchemaManager } from '../config/schemaManager.js';

/**
 * DatabaseInitializer class manages database startup and shutdown procedures
 */
class DatabaseInitializer {
  static isInitialized = false;
  static schemaManager = null;

  /**
   * Initialize database connection and schema during application startup
   * @returns {Promise<void>}
   */
  static async initialize() {
    try {
      console.log('Starting database initialization...');
      
      // Initialize database connection pool
      await DatabaseConnection.initialize();
      
      // Create schema manager
      this.schemaManager = createSchemaManager(DatabaseConnection);
      
      // Initialize database schema (create tables if they don't exist)
      await this.schemaManager.initializeDatabase();
      
      // Verify database health
      const isHealthy = await this.schemaManager.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed after initialization');
      }
      
      this.isInitialized = true;
      console.log('Database initialization completed successfully');
      
      // Log database statistics
      const stats = await this.schemaManager.getDatabaseStats();
      console.log('Database stats:', {
        totalRequests: stats.total_requests,
        pendingRequests: stats.pending_requests,
        processingRequests: stats.processing_requests,
        completedRequests: stats.completed_requests
      });
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  /**
   * Gracefully shutdown database connections
   * @returns {Promise<void>}
   */
  static async shutdown() {
    try {
      console.log('Starting database shutdown...');
      
      if (DatabaseConnection.pool) {
        await DatabaseConnection.close();
      }
      
      this.isInitialized = false;
      this.schemaManager = null;
      
      console.log('Database shutdown completed successfully');
    } catch (error) {
      console.error('Database shutdown failed:', error);
      throw new Error(`Failed to shutdown database: ${error.message}`);
    }
  }

  /**
   * Check if database is initialized and healthy
   * @returns {Promise<boolean>}
   */
  static async isHealthy() {
    try {
      if (!this.isInitialized || !this.schemaManager) {
        return false;
      }
      
      return await this.schemaManager.healthCheck();
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database connection statistics
   * @returns {Object}
   */
  static getConnectionStats() {
    return DatabaseConnection.getPoolStats();
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>}
   */
  static async getDatabaseStats() {
    if (!this.schemaManager) {
      throw new Error('Database not initialized');
    }
    
    return await this.schemaManager.getDatabaseStats();
  }

  /**
   * Reset database for testing purposes
   * @returns {Promise<void>}
   */
  static async resetForTesting() {
    if (!this.schemaManager) {
      throw new Error('Database not initialized');
    }
    
    console.log('Resetting database for testing...');
    await this.schemaManager.resetDatabase();
    console.log('Database reset completed');
  }
}

export default DatabaseInitializer;