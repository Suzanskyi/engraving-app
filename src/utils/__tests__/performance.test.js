import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  PerformanceMonitor, 
  CanvasMemoryManager, 
  throttle, 
  debounce,
  requestAnimFrame,
  cancelAnimFrame,
  optimizeCanvasForHiDPI
} from '../performance.js';

// Mock canvas and context
const createMockCanvas = () => ({
  width: 600,
  height: 400,
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn()
  })),
  style: {}
});

// Mock document.createElement
global.document = {
  createElement: vi.fn(() => createMockCanvas())
};

// Mock window for animation frame
global.window = {
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  cancelAnimationFrame: vi.fn(clearTimeout),
  devicePixelRatio: 2
};

describe('Performance Utilities', () => {
  describe('PerformanceMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      monitor.stop();
    });

    it('should start and stop monitoring', () => {
      expect(monitor.isMonitoring).toBe(false);
      
      monitor.start();
      expect(monitor.isMonitoring).toBe(true);
      
      monitor.stop();
      expect(monitor.isMonitoring).toBe(false);
    });

    it('should track operation times', async () => {
      const testOperation = vi.fn(() => Promise.resolve('result'));
      
      const result = await monitor.timeOperation('test_op', testOperation);
      
      expect(result).toBe('result');
      expect(monitor.getOperationTimes().has('test_op')).toBe(true);
      expect(typeof monitor.getOperationTimes().get('test_op')).toBe('number');
    });

    it('should detect slow operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 20));
      
      await monitor.timeOperation('slow_op', slowOperation);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected: slow_op took')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle operation errors', async () => {
      const errorOperation = () => Promise.reject(new Error('Test error'));
      
      await expect(monitor.timeOperation('error_op', errorOperation))
        .rejects.toThrow('Test error');
      
      expect(monitor.getOperationTimes().has('error_op_error')).toBe(true);
    });

    it('should clear operation times', () => {
      monitor.operationTimes.set('test', 10);
      expect(monitor.getOperationTimes().size).toBe(1);
      
      monitor.clearOperationTimes();
      expect(monitor.getOperationTimes().size).toBe(0);
    });
  });

  describe('CanvasMemoryManager', () => {
    let manager;

    beforeEach(() => {
      manager = new CanvasMemoryManager();
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should create and return canvases', () => {
      const canvas = manager.getCanvas(600, 400);
      
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(600);
      expect(canvas.height).toBe(400);
    });

    it('should reuse canvases from pool', () => {
      const canvas1 = manager.getCanvas(600, 400);
      manager.returnCanvas(canvas1);
      
      const canvas2 = manager.getCanvas(600, 400);
      
      expect(canvas2).toBe(canvas1);
    });

    it('should limit pool size', () => {
      const canvases = [];
      
      // Create more canvases than pool size
      for (let i = 0; i < 10; i++) {
        const canvas = manager.getCanvas(100, 100);
        canvases.push(canvas);
      }
      
      // Return all canvases
      canvases.forEach(canvas => manager.returnCanvas(canvas));
      
      // Pool should be limited to maxPoolSize
      expect(manager.canvasPool.length).toBeLessThanOrEqual(manager.maxPoolSize);
    });

    it('should provide optimized context', () => {
      const canvas = manager.getCanvas(600, 400);
      const ctx = manager.getOptimizedContext(canvas);
      
      expect(ctx).toBeDefined();
      expect(ctx.imageSmoothingEnabled).toBe(true);
      expect(ctx.imageSmoothingQuality).toBe('high');
    });

    it('should cache and retrieve image data', () => {
      const mockImageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      
      manager.cacheImageData('test_key', mockImageData);
      const retrieved = manager.getCachedImageData('test_key');
      
      expect(retrieved).toBe(mockImageData);
    });

    it('should limit cache size', () => {
      // Fill cache beyond limit
      for (let i = 0; i < 15; i++) {
        const mockImageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
        manager.cacheImageData(`key_${i}`, mockImageData);
      }
      
      expect(manager.imageDataCache.size).toBeLessThanOrEqual(manager.maxCacheSize);
    });

    it('should provide memory statistics', () => {
      const canvas = manager.getCanvas(100, 100);
      manager.returnCanvas(canvas);
      
      const mockImageData = { data: new Uint8ClampedArray(400) };
      manager.cacheImageData('test', mockImageData);
      
      const stats = manager.getMemoryStats();
      
      expect(stats.canvasPoolSize).toBe(1);
      expect(stats.imageCacheSize).toBe(1);
      expect(stats.estimatedMemoryUsage).toBeGreaterThan(0);
    });

    it('should cleanup resources', () => {
      const canvas = manager.getCanvas(100, 100);
      manager.returnCanvas(canvas);
      
      const mockImageData = { data: new Uint8ClampedArray(400) };
      manager.cacheImageData('test', mockImageData);
      
      manager.cleanup();
      
      expect(manager.canvasPool.length).toBe(0);
      expect(manager.imageDataCache.size).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 50);
      
      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 60);
    });

    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 50);
      
      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 60);
    });

    it('should optimize canvas for high DPI', () => {
      const canvas = createMockCanvas();
      const ctx = optimizeCanvasForHiDPI(canvas, 600, 400);
      
      expect(canvas.width).toBe(1200); // 600 * devicePixelRatio (2)
      expect(canvas.height).toBe(800); // 400 * devicePixelRatio (2)
      expect(canvas.style.width).toBe('600px');
      expect(canvas.style.height).toBe('400px');
      expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    });

    it('should handle animation frame requests', () => {
      const callback = vi.fn();
      const id = requestAnimFrame(callback);
      
      expect(id).toBeDefined();
      expect(window.requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it('should cancel animation frame requests', () => {
      const id = 123;
      cancelAnimFrame(id);
      
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(id);
    });
  });

  describe('Performance Integration', () => {
    it('should work together for canvas operations', async () => {
      const monitor = new PerformanceMonitor();
      const manager = new CanvasMemoryManager();
      
      monitor.start();
      
      // Simulate canvas operations
      const canvas = manager.getCanvas(600, 400);
      const ctx = manager.getOptimizedContext(canvas);
      
      await monitor.timeOperation('canvas_operation', async () => {
        // Simulate some canvas work
        ctx.fillRect(0, 0, 100, 100);
        return 'completed';
      });
      
      manager.returnCanvas(canvas);
      
      const stats = manager.getMemoryStats();
      const operationTimes = monitor.getOperationTimes();
      
      expect(stats.canvasPoolSize).toBe(1);
      expect(operationTimes.has('canvas_operation')).toBe(true);
      
      monitor.stop();
      manager.cleanup();
    });

    it('should handle memory pressure gracefully', () => {
      const manager = new CanvasMemoryManager();
      
      // Create many canvases to test memory management
      const canvases = [];
      for (let i = 0; i < 20; i++) {
        canvases.push(manager.getCanvas(1000, 1000));
      }
      
      // Return all canvases
      canvases.forEach(canvas => manager.returnCanvas(canvas));
      
      // Pool should be limited
      expect(manager.canvasPool.length).toBeLessThanOrEqual(manager.maxPoolSize);
      
      // Memory usage should be reasonable
      const stats = manager.getMemoryStats();
      expect(stats.estimatedMemoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      
      manager.cleanup();
    });
  });
});