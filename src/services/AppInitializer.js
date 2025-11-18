/**
 * Application Initializer Service
 * Handles application startup and shutdown procedures including database initialization
 */

import DatabaseInitializer from './DatabaseInitializer.js';

/**
 * AppInitializer class manages application lifecycle
 */
class AppInitializer {
  static isInitialized = false;
  static shutdownHandlers = [];

  /**
   * Initialize the application with all required services
   * @returns {Promise<void>}
   */
  static async initialize() {
    try {
      console.log('Starting application initialization...');
      
      // Initialize database
      await DatabaseInitializer.initialize();
      
      // Register shutdown handlers
      this.registerShutdownHandlers();
      
      this.isInitialized = true;
      console.log('Application initialization completed successfully');
      
    } catch (error) {
      console.error('Application initialization failed:', error);
      
      // Attempt cleanup on failure
      try {
        await this.shutdown();
      } catch (cleanupError) {
        console.error('Cleanup after initialization failure also failed:', cleanupError);
      }
      
      throw new Error(`Application initialization failed: ${error.message}`);
    }
  }

  /**
   * Gracefully shutdown the application
   * @returns {Promise<void>}
   */
  static async shutdown() {
    try {
      console.log('Starting application shutdown...');
      
      // Execute all registered shutdown handlers
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('Shutdown handler failed:', error);
        }
      }
      
      // Shutdown database
      await DatabaseInitializer.shutdown();
      
      this.isInitialized = false;
      console.log('Application shutdown completed successfully');
      
    } catch (error) {
      console.error('Application shutdown failed:', error);
      throw new Error(`Application shutdown failed: ${error.message}`);
    }
  }

  /**
   * Register process event handlers for graceful shutdown
   * @private
   */
  static registerShutdownHandlers() {
    // Handle process termination signals
    const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`Received ${signal}, initiating graceful shutdown...`);
        
        try {
          await this.shutdown();
          process.exit(0);
        } catch (error) {
          console.error('Graceful shutdown failed:', error);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      
      try {
        await this.shutdown();
      } catch (shutdownError) {
        console.error('Shutdown after uncaught exception failed:', shutdownError);
      }
      
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled promise rejection at:', promise, 'reason:', reason);
      
      try {
        await this.shutdown();
      } catch (shutdownError) {
        console.error('Shutdown after unhandled rejection failed:', shutdownError);
      }
      
      process.exit(1);
    });

    console.log('Shutdown handlers registered successfully');
  }

  /**
   * Add a custom shutdown handler
   * @param {Function} handler - Async function to execute during shutdown
   */
  static addShutdownHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Shutdown handler must be a function');
    }
    
    this.shutdownHandlers.push(handler);
  }

  /**
   * Check if application is initialized and healthy
   * @returns {Promise<boolean>}
   */
  static async isHealthy() {
    try {
      if (!this.isInitialized) {
        return false;
      }
      
      // Check database health
      const dbHealthy = await DatabaseInitializer.isHealthy();
      
      return dbHealthy;
    } catch (error) {
      console.error('Application health check failed:', error);
      return false;
    }
  }

  /**
   * Get application status information
   * @returns {Promise<Object>}
   */
  static async getStatus() {
    try {
      const isHealthy = await this.isHealthy();
      const dbStats = this.isInitialized ? await DatabaseInitializer.getDatabaseStats() : null;
      const connectionStats = this.isInitialized ? DatabaseInitializer.getConnectionStats() : null;
      
      return {
        initialized: this.isInitialized,
        healthy: isHealthy,
        database: {
          stats: dbStats,
          connections: connectionStats
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get application status:', error);
      return {
        initialized: this.isInitialized,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default AppInitializer;