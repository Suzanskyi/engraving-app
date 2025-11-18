/**
 * Error handling utilities for the application
 */

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  CANVAS_ERROR: 'CANVAS_ERROR',
  IMAGE_LOAD_ERROR: 'IMAGE_LOAD_ERROR',
  PERFORMANCE_ERROR: 'PERFORMANCE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.CANVAS_ERROR, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error logger with different levels
 */
export class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  /**
   * Log an error
   * @param {Error|AppError} error - Error to log
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional metadata
   */
  logError(error, context = 'unknown', metadata = {}) {
    const errorEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      type: error.type || ErrorTypes.CANVAS_ERROR,
      context,
      metadata,
      stack: error.stack,
      originalError: error.originalError
    };

    this.errors.push(errorEntry);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console based on error type
    this.logToConsole(errorEntry);

    return errorEntry.id;
  }

  /**
   * Log to console with appropriate level
   * @param {Object} errorEntry - Error entry to log
   */
  logToConsole(errorEntry) {
    const logMessage = `[${errorEntry.context}] ${errorEntry.message}`;
    
    switch (errorEntry.type) {
      case ErrorTypes.PERFORMANCE_ERROR:
        console.warn(logMessage, errorEntry.metadata);
        break;
      case ErrorTypes.VALIDATION_ERROR:
        console.info(logMessage, errorEntry.metadata);
        break;
      case ErrorTypes.MEMORY_ERROR:
      case ErrorTypes.CANVAS_ERROR:
      case ErrorTypes.IMAGE_LOAD_ERROR:
      case ErrorTypes.NETWORK_ERROR:
        console.error(logMessage, errorEntry.metadata);
        break;
      default:
        console.log(logMessage, errorEntry.metadata);
    }
  }

  /**
   * Get errors by type
   * @param {string} type - Error type to filter by
   * @returns {Array} Filtered errors
   */
  getErrorsByType(type) {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Get recent errors
   * @param {number} count - Number of recent errors to get
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Generate unique ID for error
   * @returns {string} Unique ID
   */
  generateId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStatistics() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recentCount: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count recent errors
      if (new Date(error.timestamp) > oneHourAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Attempt to recover from canvas errors
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Function} fallbackRenderer - Fallback rendering function
   * @returns {boolean} Success of recovery
   */
  static async recoverCanvas(canvas, fallbackRenderer) {
    try {
      // Try to get a new context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Clear and reset canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.save();

      // Try fallback renderer if provided
      if (fallbackRenderer) {
        await fallbackRenderer(ctx);
      }

      return true;
    } catch (error) {
      errorLogger.logError(
        new AppError('Canvas recovery failed', ErrorTypes.CANVAS_ERROR, error),
        'ErrorRecovery.recoverCanvas'
      );
      return false;
    }
  }

  /**
   * Recover from memory errors by clearing caches
   * @param {Object} memoryManager - Memory manager instance
   * @returns {boolean} Success of recovery
   */
  static recoverMemory(memoryManager) {
    try {
      if (memoryManager && typeof memoryManager.cleanup === 'function') {
        memoryManager.cleanup();
      }

      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }

      return true;
    } catch (error) {
      errorLogger.logError(
        new AppError('Memory recovery failed', ErrorTypes.MEMORY_ERROR, error),
        'ErrorRecovery.recoverMemory'
      );
      return false;
    }
  }

  /**
   * Recover from image loading errors
   * @param {string} imageUrl - Failed image URL
   * @param {Function} fallbackHandler - Fallback handler
   * @returns {Promise<boolean>} Success of recovery
   */
  static async recoverImageLoad(imageUrl, fallbackHandler) {
    try {
      // Try loading with different parameters
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => {
          if (fallbackHandler) {
            fallbackHandler();
          }
          resolve(false);
        };
        
        // Try without crossOrigin if original failed
        img.src = imageUrl;
      });
    } catch (error) {
      errorLogger.logError(
        new AppError('Image recovery failed', ErrorTypes.IMAGE_LOAD_ERROR, error),
        'ErrorRecovery.recoverImageLoad'
      );
      return false;
    }
  }
}

/**
 * Performance error detection
 */
export class PerformanceErrorDetector {
  constructor() {
    this.thresholds = {
      renderTime: 16, // 60fps threshold
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cacheSize: 50 // Maximum cache entries
    };
  }

  /**
   * Check if render time exceeds threshold
   * @param {number} renderTime - Render time in milliseconds
   * @returns {AppError|null} Error if threshold exceeded
   */
  checkRenderTime(renderTime) {
    if (renderTime > this.thresholds.renderTime) {
      return new AppError(
        `Render time ${renderTime.toFixed(2)}ms exceeds threshold ${this.thresholds.renderTime}ms`,
        ErrorTypes.PERFORMANCE_ERROR
      );
    }
    return null;
  }

  /**
   * Check memory usage
   * @param {number} memoryUsage - Memory usage in bytes
   * @returns {AppError|null} Error if threshold exceeded
   */
  checkMemoryUsage(memoryUsage) {
    if (memoryUsage > this.thresholds.memoryUsage) {
      return new AppError(
        `Memory usage ${(memoryUsage / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        ErrorTypes.MEMORY_ERROR
      );
    }
    return null;
  }

  /**
   * Check cache size
   * @param {number} cacheSize - Number of cache entries
   * @returns {AppError|null} Error if threshold exceeded
   */
  checkCacheSize(cacheSize) {
    if (cacheSize > this.thresholds.cacheSize) {
      return new AppError(
        `Cache size ${cacheSize} exceeds threshold ${this.thresholds.cacheSize}`,
        ErrorTypes.MEMORY_ERROR
      );
    }
    return null;
  }
}

// Global instances
export const errorLogger = new ErrorLogger();
export const performanceErrorDetector = new PerformanceErrorDetector();

/**
 * Global error handler for unhandled errors
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorLogger.logError(
      new AppError(event.message, ErrorTypes.CANVAS_ERROR, event.error),
      'GlobalErrorHandler',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(
      new AppError(event.reason?.message || 'Unhandled promise rejection', ErrorTypes.CANVAS_ERROR, event.reason),
      'GlobalErrorHandler',
      {
        type: 'unhandledrejection'
      }
    );
  });
}

/**
 * Utility function to wrap async operations with error handling
 * @param {Function} operation - Async operation to wrap
 * @param {string} context - Context for error logging
 * @param {Function} fallback - Fallback function on error
 * @returns {Function} Wrapped operation
 */
export function withErrorHandling(operation, context, fallback = null) {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(error.message, ErrorTypes.CANVAS_ERROR, error);
      errorLogger.logError(appError, context);
      
      if (fallback) {
        return fallback(error);
      }
      
      throw appError;
    }
  };
}

/**
 * Utility function to wrap sync operations with error handling
 * @param {Function} operation - Sync operation to wrap
 * @param {string} context - Context for error logging
 * @param {Function} fallback - Fallback function on error
 * @returns {Function} Wrapped operation
 */
export function withSyncErrorHandling(operation, context, fallback = null) {
  return (...args) => {
    try {
      return operation(...args);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(error.message, ErrorTypes.CANVAS_ERROR, error);
      errorLogger.logError(appError, context);
      
      if (fallback) {
        return fallback(error);
      }
      
      throw appError;
    }
  };
}