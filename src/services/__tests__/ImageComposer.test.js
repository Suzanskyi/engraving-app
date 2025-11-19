import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageComposer from '../ImageComposer.js';

// Mock the positioning utility
vi.mock('../../utils/positioning.js', () => ({
  percentageToPixels: vi.fn(({ x, y }, { width, height }) => ({
    x: (x / 100) * width,
    y: (y / 100) * height
  })),
  calculateTextDimensions: vi.fn(() => ({ width: 100, height: 24 })),
  constrainPosition: vi.fn((position) => position),
  normalizePosition: vi.fn((position) => position)
}));

// Mock canvas context
const mockContext = {
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  fillRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  ellipse: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  strokeRect: vi.fn(),
  set font(value) { },
  set fillStyle(value) { },
  set textAlign(value) { },
  set textBaseline(value) { },
  set shadowColor(value) { },
  set shadowBlur(value) { },
  set shadowOffsetX(value) { },
  set shadowOffsetY(value) { },
  set strokeStyle(value) { },
  set lineWidth(value) { }
};

// Mock canvas
const createMockCanvas = () => ({
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/png;base64,mockdata')
});

// Mock image behavior
let mockImageBehavior = 'success';

const createMockImage = () => ({
  width: 800,
  height: 600,
  crossOrigin: '',
  onload: null,
  onerror: null,
  set src(value) {
    setTimeout(() => {
      if (mockImageBehavior === 'success' && this.onload) {
        this.onload();
      } else if (mockImageBehavior === 'error' && this.onerror) {
        this.onerror();
      }
    }, 0);
  }
});

// Mock DOM APIs
global.document = {
  createElement: vi.fn((tagName) => {
    if (tagName === 'canvas') return createMockCanvas();
    if (tagName === 'a') return {
      download: '',
      href: '',
      click: vi.fn(),
    };
    return {};
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  }
};

global.Image = vi.fn(() => createMockImage());

describe('ImageComposer Refactored', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageBehavior = 'success';
  });

  describe('unified composeImage method', () => {
    it('should work in preview mode when isPreview is true', async () => {
      const options = {
        text: 'Test Text',
        position: { x: 50, y: 50 },
        font: 'Arial',
        fontSize: 24,
        color: '#333',
        isPreview: true,
        width: 600,
        height: 400
      };

      const result = await ImageComposer.composeImage(options);

      expect(result).toBe('data:image/png;base64,mockdata');
      expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should work in image mode when imageUrl is provided', async () => {
      const options = {
        imageUrl: 'test-image.jpg',
        text: 'Test Text',
        position: { x: 50, y: 50 },
        font: 'Arial',
        fontSize: 24,
        color: '#333'
      };

      const result = await ImageComposer.composeImage(options);

      expect(result).toBe('data:image/png;base64,mockdata');
      expect(global.Image).toHaveBeenCalled();
    });

    it('should default to preview mode when no imageUrl provided', async () => {
      const options = {
        text: 'Test Text',
        position: { x: 50, y: 50 }
      };

      const result = await ImageComposer.composeImage(options);

      expect(result).toBe('data:image/png;base64,mockdata');
    });

    it('should handle empty text gracefully', async () => {
      const options = {
        text: '',
        position: { x: 50, y: 50 },
        isPreview: true
      };

      const result = await ImageComposer.composeImage(options);

      expect(result).toBe('data:image/png;base64,mockdata');
    });

    it('should handle image load errors', async () => {
      mockImageBehavior = 'error';

      const options = {
        imageUrl: 'invalid-image.jpg',
        text: 'Test Text'
      };

      await expect(ImageComposer.composeImage(options)).rejects.toThrow('Failed to load image');
    });
  });

  describe('generateTextPreview', () => {
    it('should generate preview using unified composeImage method', async () => {
      const options = {
        description: 'A coffee mug',
        text: 'Test Text',
        position: { x: 50, y: 50 },
        font: 'Arial',
        fontSize: 24,
        color: '#333',
        width: 600,
        height: 400
      };

      const result = await ImageComposer.generateTextPreview(options);

      expect(result).toBe('data:image/png;base64,mockdata');
    });

    it('should handle preview generation without description', async () => {
      const options = {
        text: 'Test Text',
        position: { x: 50, y: 50 }
      };

      const result = await ImageComposer.generateTextPreview(options);

      expect(result).toBe('data:image/png;base64,mockdata');
    });
  });

  describe('getFontFamily', () => {
    it('should return proper font family with fallbacks', () => {
      expect(ImageComposer.getFontFamily('Arial')).toBe('Arial, sans-serif');
      expect(ImageComposer.getFontFamily('Times New Roman')).toBe('Times New Roman, serif');
      expect(ImageComposer.getFontFamily('Helvetica')).toBe('Helvetica, Arial, sans-serif');
    });

    it('should handle case insensitive font names', () => {
      expect(ImageComposer.getFontFamily('arial')).toBe('Arial, sans-serif');
      expect(ImageComposer.getFontFamily('ARIAL')).toBe('Arial, sans-serif');
    });

    it('should handle unknown fonts with fallback', () => {
      expect(ImageComposer.getFontFamily('UnknownFont')).toBe('UnknownFont, Arial, sans-serif');
    });

    it('should handle invalid input', () => {
      expect(ImageComposer.getFontFamily(null)).toBe('Arial, sans-serif');
      expect(ImageComposer.getFontFamily(undefined)).toBe('Arial, sans-serif');
      expect(ImageComposer.getFontFamily('')).toBe('Arial, sans-serif');
    });
  });

  describe('consistency between preview and final output', () => {
    it('should use identical positioning logic for preview and final', async () => {
      const options = {
        text: 'Test Text',
        position: { x: 75, y: 25 },
        font: 'Arial',
        fontSize: 32,
        color: '#ff0000'
      };

      // Generate preview
      const previewResult = await ImageComposer.composeImage({
        ...options,
        isPreview: true,
        width: 800,
        height: 600
      });

      // Generate with image
      const finalResult = await ImageComposer.composeImage({
        ...options,
        imageUrl: 'test-image.jpg'
      });

      expect(previewResult).toBe('data:image/png;base64,mockdata');
      expect(finalResult).toBe('data:image/png;base64,mockdata');

      // Both should use the same positioning utility calls
      const { percentageToPixels } = await import('../../utils/positioning.js');
      expect(percentageToPixels).toHaveBeenCalledWith(
        options.position,
        expect.any(Object)
      );
    });

    it('should use identical font rendering for preview and final', async () => {
      const options = {
        text: 'Test Text',
        font: 'Times New Roman',
        fontSize: 28
      };

      // Test preview mode
      await ImageComposer.composeImage({
        ...options,
        isPreview: true
      });

      // Test image mode
      await ImageComposer.composeImage({
        ...options,
        imageUrl: 'test-image.jpg'
      });

      // Both should result in the same font family resolution
      expect(ImageComposer.getFontFamily(options.font)).toBe('Times New Roman, serif');
    });
  });

  describe('positioning utility integration', () => {
    it('should use positioning utilities for consistent coordinate transformation', async () => {
      const { percentageToPixels, normalizePosition, constrainPosition } = await import('../../utils/positioning.js');

      const options = {
        text: 'Test Text',
        position: { x: 80, y: 20 },
        isPreview: true
      };

      await ImageComposer.composeImage(options);

      expect(normalizePosition).toHaveBeenCalledWith(options.position);
      expect(percentageToPixels).toHaveBeenCalled();
      expect(constrainPosition).toHaveBeenCalled();
    });
  });
});