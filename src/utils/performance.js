/**
 * Performance utilities for canvas operations and memory management
 */

/**
 * Performance monitor for tracking frame rates and operation times
 */
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.operationTimes = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring performance
   */
  start() {
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFPS();
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
  }

  /**
   * Measure FPS using requestAnimationFrame
   */
  measureFPS() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measureFPS());
  }

  /**
   * Time an operation
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Function to time
   * @returns {*} - Result of the operation
   */
  async timeOperation(operationName, operation) {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.operationTimes.set(operationName, duration);
      
      // Log slow operations (> 16ms for 60fps)
      if (duration > 16) {
        console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.operationTimes.set(`${operationName}_error`, duration);
      throw error;
    }
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get operation times
   * @returns {Map} Map of operation names to times
   */
  getOperationTimes() {
    return new Map(this.operationTimes);
  }

  /**
   * Clear operation times
   */
  clearOperationTimes() {
    this.operationTimes.clear();
  }
}

/**
 * Canvas memory manager for efficient canvas operations
 */
export class CanvasMemoryManager {
  constructor() {
    this.canvasPool = [];
    this.contextPool = [];
    this.imageDataCache = new Map();
    this.maxCacheSize = 10;
    this.maxPoolSize = 5;
  }

  /**
   * Get a canvas from the pool or create a new one
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {HTMLCanvasElement} Canvas element
   */
  getCanvas(width, height) {
    let canvas = this.canvasPool.pop();
    
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    
    canvas.width = width;
    canvas.height = height;
    
    return canvas;
  }

  /**
   * Return a canvas to the pool
   * @param {HTMLCanvasElement} canvas - Canvas to return
   */
  returnCanvas(canvas) {
    if (this.canvasPool.length < this.maxPoolSize) {
      try {
        // Clear the canvas
        const ctx = canvas.getContext('2d');
        if (ctx && typeof ctx.clearRect === 'function') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        this.canvasPool.push(canvas);
      } catch (error) {
        // Ignore errors when returning canvas (e.g., in test environment)
        console.warn('Failed to clear canvas when returning to pool:', error.message);
      }
    }
  }

  /**
   * Get optimized canvas context with performance settings
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {CanvasRenderingContext2D} Optimized context
   */
  getOptimizedContext(canvas) {
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Allow async rendering
      willReadFrequently: false // Optimize for write operations
    });

    // Set performance-optimized defaults
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    return ctx;
  }

  /**
   * Cache image data for reuse
   * @param {string} key - Cache key
   * @param {ImageData} imageData - Image data to cache
   */
  cacheImageData(key, imageData) {
    if (this.imageDataCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.imageDataCache.keys().next().value;
      this.imageDataCache.delete(firstKey);
    }
    
    this.imageDataCache.set(key, imageData);
  }

  /**
   * Get cached image data
   * @param {string} key - Cache key
   * @returns {ImageData|null} Cached image data or null
   */
  getCachedImageData(key) {
    return this.imageDataCache.get(key) || null;
  }

  /**
   * Clear all caches and pools
   */
  cleanup() {
    this.canvasPool = [];
    this.contextPool = [];
    this.imageDataCache.clear();
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Memory usage stats
   */
  getMemoryStats() {
    return {
      canvasPoolSize: this.canvasPool.length,
      contextPoolSize: this.contextPool.length,
      imageCacheSize: this.imageDataCache.size,
      estimatedMemoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage in bytes
   * @returns {number} Estimated memory usage
   */
  estimateMemoryUsage() {
    let totalBytes = 0;
    
    // Estimate canvas pool memory
    this.canvasPool.forEach(canvas => {
      totalBytes += canvas.width * canvas.height * 4; // 4 bytes per pixel (RGBA)
    });
    
    // Estimate image data cache memory
    this.imageDataCache.forEach(imageData => {
      totalBytes += imageData.data.length;
    });
    
    return totalBytes;
  }
}

/**
 * Throttle function calls to improve performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function calls to improve performance
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Request animation frame with fallback
 * @param {Function} callback - Callback function
 * @returns {number} Request ID
 */
export function requestAnimFrame(callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  )(callback);
}

/**
 * Cancel animation frame with fallback
 * @param {number} id - Request ID
 */
export function cancelAnimFrame(id) {
  (
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    clearTimeout
  )(id);
}

/**
 * Optimize canvas for high DPI displays
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Display width
 * @param {number} height - Display height
 * @returns {CanvasRenderingContext2D} Optimized context
 */
export function optimizeCanvasForHiDPI(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Set actual size in memory (scaled up for retina)
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  
  // Scale the canvas back down using CSS
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Scale the drawing context so everything draws at the correct size
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  return ctx;
}

/**
 * Batch canvas operations for better performance
 */
export class CanvasBatcher {
  constructor(ctx) {
    this.ctx = ctx;
    this.operations = [];
    this.isRecording = false;
  }

  /**
   * Start recording operations
   */
  startBatch() {
    this.isRecording = true;
    this.operations = [];
  }

  /**
   * Add operation to batch
   * @param {Function} operation - Canvas operation
   */
  addOperation(operation) {
    if (this.isRecording) {
      this.operations.push(operation);
    } else {
      operation(this.ctx);
    }
  }

  /**
   * Execute all batched operations
   */
  executeBatch() {
    if (!this.isRecording) return;
    
    this.ctx.save();
    
    for (const operation of this.operations) {
      operation(this.ctx);
    }
    
    this.ctx.restore();
    this.operations = [];
    this.isRecording = false;
  }

  /**
   * Clear batch without executing
   */
  clearBatch() {
    this.operations = [];
    this.isRecording = false;
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const canvasMemoryManager = new CanvasMemoryManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.stop();
    canvasMemoryManager.cleanup();
  });
}