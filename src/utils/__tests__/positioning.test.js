import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  percentageToPixels,
  pixelsToPercentage,
  constrainPosition,
  calculateTextDimensions,
  normalizePosition,
  scalePosition,
  createCenteredPosition,
  isValidPercentagePosition,
  calculateSafeBoundaries,
  isPositionWithinBounds,
  constrainPositionWithFeedback
} from '../positioning.js';

describe('Positioning Utility', () => {
  describe('percentageToPixels', () => {
    it('should convert percentage position to pixel coordinates', () => {
      const percentagePosition = { x: 50, y: 25 };
      const imageDimensions = { width: 800, height: 600 };
      
      const result = percentageToPixels(percentagePosition, imageDimensions);
      
      expect(result).toEqual({ x: 400, y: 150 });
    });

    it('should handle edge cases (0% and 100%)', () => {
      const imageDimensions = { width: 1000, height: 500 };
      
      expect(percentageToPixels({ x: 0, y: 0 }, imageDimensions))
        .toEqual({ x: 0, y: 0 });
      
      expect(percentageToPixels({ x: 100, y: 100 }, imageDimensions))
        .toEqual({ x: 1000, y: 500 });
    });

    it('should throw error for invalid parameters', () => {
      expect(() => percentageToPixels(null, { width: 100, height: 100 }))
        .toThrow('Invalid parameters: percentagePosition and imageDimensions are required');
      
      expect(() => percentageToPixels({ x: 50, y: 50 }, null))
        .toThrow('Invalid parameters: percentagePosition and imageDimensions are required');
      
      expect(() => percentageToPixels({ x: 'invalid', y: 50 }, { width: 100, height: 100 }))
        .toThrow('Position coordinates must be numbers');
      
      expect(() => percentageToPixels({ x: 50, y: 50 }, { width: 0, height: 100 }))
        .toThrow('Image dimensions must be positive numbers');
    });
  });

  describe('pixelsToPercentage', () => {
    it('should convert pixel coordinates to percentage position', () => {
      const pixelPosition = { x: 400, y: 150 };
      const imageDimensions = { width: 800, height: 600 };
      
      const result = pixelsToPercentage(pixelPosition, imageDimensions);
      
      expect(result).toEqual({ x: 50, y: 25 });
    });

    it('should handle edge cases', () => {
      const imageDimensions = { width: 1000, height: 500 };
      
      expect(pixelsToPercentage({ x: 0, y: 0 }, imageDimensions))
        .toEqual({ x: 0, y: 0 });
      
      expect(pixelsToPercentage({ x: 1000, y: 500 }, imageDimensions))
        .toEqual({ x: 100, y: 100 });
    });

    it('should throw error for invalid parameters', () => {
      expect(() => pixelsToPercentage(null, { width: 100, height: 100 }))
        .toThrow('Invalid parameters: pixelPosition and imageDimensions are required');
      
      expect(() => pixelsToPercentage({ x: 50, y: 50 }, { width: -100, height: 100 }))
        .toThrow('Image dimensions must be positive numbers');
    });
  });

  describe('constrainPosition', () => {
    it('should constrain position within image boundaries', () => {
      const position = { x: 95, y: 95 }; // Near edge
      const textDimensions = { width: 100, height: 50 };
      const imageDimensions = { width: 800, height: 600 };
      
      const result = constrainPosition(position, textDimensions, imageDimensions);
      
      // Should be pulled back from the edge
      expect(result.x).toBeLessThan(95);
      expect(result.y).toBeLessThan(95);
      expect(result.x).toBeGreaterThan(0);
      expect(result.y).toBeGreaterThan(0);
    });

    it('should not modify position if already within bounds', () => {
      const position = { x: 50, y: 50 }; // Center
      const textDimensions = { width: 50, height: 25 };
      const imageDimensions = { width: 800, height: 600 };
      
      const result = constrainPosition(position, textDimensions, imageDimensions);
      
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should handle custom padding', () => {
      const position = { x: 8, y: 8 }; // Near edge
      const textDimensions = { width: 40, height: 20 };
      const imageDimensions = { width: 800, height: 600 };
      const padding = 10;
      
      const result = constrainPosition(position, textDimensions, imageDimensions, padding);
      
      // Should be pushed away from edge due to padding
      expect(result.x).toBeGreaterThan(10);
      expect(result.y).toBeGreaterThan(10);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => constrainPosition(null, { width: 50, height: 25 }, { width: 800, height: 600 }))
        .toThrow('Invalid parameters: position, textDimensions, and imageDimensions are required');
      
      expect(() => constrainPosition({ x: 50, y: 50 }, { width: 50, height: 25 }, { width: 800, height: 600 }, -5))
        .toThrow('Padding must be a number between 0 and 50');
    });
  });

  describe('calculateTextDimensions', () => {
    let mockContext;

    beforeEach(() => {
      mockContext = {
        font: 'Arial',
        measureText: vi.fn(() => ({ width: 100 }))
      };
    });

    it('should calculate text dimensions correctly', () => {
      const result = calculateTextDimensions('Hello World', 'Arial', 16, mockContext);
      
      expect(result).toEqual({ width: 100, height: 16 });
      expect(mockContext.measureText).toHaveBeenCalledWith('Hello World');
    });

    it('should set and restore font context', () => {
      const originalFont = 'Times';
      mockContext.font = originalFont;
      
      calculateTextDimensions('Test', 'Arial', 20, mockContext);
      
      expect(mockContext.font).toBe(originalFont);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => calculateTextDimensions(null, 'Arial', 16, mockContext))
        .toThrow('Invalid parameters: text, fontFamily, fontSize, and context are required');
      
      expect(() => calculateTextDimensions(123, 'Arial', 16, mockContext))
        .toThrow('Text must be a string');
      
      expect(() => calculateTextDimensions('Test', 'Arial', -5, mockContext))
        .toThrow('Font size must be a positive number');
    });
  });

  describe('normalizePosition', () => {
    it('should normalize position within 0-100 range', () => {
      expect(normalizePosition({ x: 150, y: -50 }))
        .toEqual({ x: 100, y: 0 });
      
      expect(normalizePosition({ x: 50, y: 75 }))
        .toEqual({ x: 50, y: 75 });
    });

    it('should throw error for invalid parameters', () => {
      expect(() => normalizePosition(null))
        .toThrow('Position is required');
      
      expect(() => normalizePosition({ x: 'invalid', y: 50 }))
        .toThrow('Position coordinates must be numbers');
    });
  });

  describe('scalePosition', () => {
    it('should maintain position when scaling between different image sizes', () => {
      const position = { x: 50, y: 25 };
      const originalDimensions = { width: 400, height: 300 };
      const newDimensions = { width: 800, height: 600 };
      
      const result = scalePosition(position, originalDimensions, newDimensions);
      
      // Position should remain the same since we use percentage-based positioning
      expect(result).toEqual({ x: 50, y: 25 });
    });

    it('should normalize out-of-bounds positions', () => {
      const position = { x: 150, y: -25 };
      const originalDimensions = { width: 400, height: 300 };
      const newDimensions = { width: 800, height: 600 };
      
      const result = scalePosition(position, originalDimensions, newDimensions);
      
      expect(result).toEqual({ x: 100, y: 0 });
    });

    it('should throw error for invalid parameters', () => {
      expect(() => scalePosition(null, { width: 400, height: 300 }, { width: 800, height: 600 }))
        .toThrow('Invalid parameters: position, originalDimensions, and newDimensions are required');
    });
  });

  describe('createCenteredPosition', () => {
    it('should return centered position', () => {
      const result = createCenteredPosition();
      expect(result).toEqual({ x: 50, y: 50 });
    });
  });

  describe('isValidPercentagePosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidPercentagePosition({ x: 50, y: 75 })).toBe(true);
      expect(isValidPercentagePosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPercentagePosition({ x: 100, y: 100 })).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isValidPercentagePosition(null)).toBe(false);
      expect(isValidPercentagePosition({ x: -10, y: 50 })).toBe(false);
      expect(isValidPercentagePosition({ x: 50, y: 150 })).toBe(false);
      expect(isValidPercentagePosition({ x: 'invalid', y: 50 })).toBe(false);
      expect(isValidPercentagePosition({})).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should handle round-trip conversion between pixels and percentage', () => {
      const originalPosition = { x: 37.5, y: 62.5 };
      const imageDimensions = { width: 800, height: 400 };
      
      // Convert to pixels and back
      const pixels = percentageToPixels(originalPosition, imageDimensions);
      const backToPercentage = pixelsToPercentage(pixels, imageDimensions);
      
      expect(backToPercentage.x).toBeCloseTo(originalPosition.x);
      expect(backToPercentage.y).toBeCloseTo(originalPosition.y);
    });

    it('should maintain text positioning across different image sizes', () => {
      const position = { x: 25, y: 75 };
      const smallImage = { width: 400, height: 300 };
      const largeImage = { width: 1600, height: 1200 };
      
      // Convert to pixels for both image sizes
      const smallPixels = percentageToPixels(position, smallImage);
      const largePixels = percentageToPixels(position, largeImage);
      
      // Verify relative positioning is maintained
      expect(smallPixels.x / smallImage.width).toBeCloseTo(largePixels.x / largeImage.width);
      expect(smallPixels.y / smallImage.height).toBeCloseTo(largePixels.y / largeImage.height);
    });

    it('should properly constrain text near image boundaries', () => {
      const imageDimensions = { width: 800, height: 600 };
      const textDimensions = { width: 200, height: 50 }; // Large text
      
      // Test all corners
      const corners = [
        { x: 5, y: 5 },    // Top-left
        { x: 95, y: 5 },   // Top-right
        { x: 5, y: 95 },   // Bottom-left
        { x: 95, y: 95 }   // Bottom-right
      ];
      
      corners.forEach(corner => {
        const constrained = constrainPosition(corner, textDimensions, imageDimensions);
        
        // Verify text stays within bounds
        const pixels = percentageToPixels(constrained, imageDimensions);
        const textHalfWidth = textDimensions.width / 2;
        const textHalfHeight = textDimensions.height / 2;
        
        expect(pixels.x - textHalfWidth).toBeGreaterThanOrEqual(0);
        expect(pixels.x + textHalfWidth).toBeLessThanOrEqual(imageDimensions.width);
        expect(pixels.y - textHalfHeight).toBeGreaterThanOrEqual(0);
        expect(pixels.y + textHalfHeight).toBeLessThanOrEqual(imageDimensions.height);
      });
    });
  });

  describe('calculateSafeBoundaries', () => {
    it('should calculate safe boundaries for text positioning', () => {
      const textDimensions = { width: 100, height: 50 };
      const imageDimensions = { width: 800, height: 600 };
      
      const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, 5);
      
      // Text width is 12.5% of image width, height is 8.33% of image height
      // With 5% padding and half-text dimensions
      expect(boundaries.minX).toBeCloseTo(11.25, 1); // 5 + 12.5/2
      expect(boundaries.maxX).toBeCloseTo(88.75, 1); // 100 - 5 - 12.5/2
      expect(boundaries.minY).toBeCloseTo(9.17, 1);  // 5 + 8.33/2
      expect(boundaries.maxY).toBeCloseTo(90.83, 1); // 100 - 5 - 8.33/2
    });

    it('should handle zero padding', () => {
      const textDimensions = { width: 80, height: 40 };
      const imageDimensions = { width: 800, height: 400 };
      
      const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, 0);
      
      expect(boundaries.minX).toBeCloseTo(5, 1);  // 10%/2
      expect(boundaries.maxX).toBeCloseTo(95, 1); // 100 - 10%/2
      expect(boundaries.minY).toBeCloseTo(5, 1);  // 10%/2
      expect(boundaries.maxY).toBeCloseTo(95, 1); // 100 - 10%/2
    });

    it('should handle large text dimensions', () => {
      const textDimensions = { width: 600, height: 400 }; // 75% x 66.7% of image
      const imageDimensions = { width: 800, height: 600 };
      
      const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, 5);
      
      // Should constrain to valid range
      expect(boundaries.minX).toBeGreaterThanOrEqual(0);
      expect(boundaries.maxX).toBeLessThanOrEqual(100);
      expect(boundaries.minY).toBeGreaterThanOrEqual(0);
      expect(boundaries.maxY).toBeLessThanOrEqual(100);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => calculateSafeBoundaries(null, { width: 800, height: 600 }))
        .toThrow('Invalid parameters: textDimensions and imageDimensions are required');
      
      expect(() => calculateSafeBoundaries({ width: 100, height: 50 }, { width: 800, height: 600 }, -5))
        .toThrow('Padding must be a number between 0 and 50');
      
      expect(() => calculateSafeBoundaries({ width: 100, height: 50 }, { width: 800, height: 600 }, 60))
        .toThrow('Padding must be a number between 0 and 50');
    });
  });

  describe('isPositionWithinBounds', () => {
    const textDimensions = { width: 100, height: 50 };
    const imageDimensions = { width: 800, height: 600 };

    it('should return true for position within bounds', () => {
      const result = isPositionWithinBounds(
        { x: 50, y: 50 },
        textDimensions,
        imageDimensions
      );
      expect(result).toBe(true);
    });

    it('should return false for position outside bounds', () => {
      const result = isPositionWithinBounds(
        { x: 5, y: 5 }, // Too close to edge
        textDimensions,
        imageDimensions
      );
      expect(result).toBe(false);
    });

    it('should handle edge cases', () => {
      // Test exact boundary positions
      const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, 5);
      
      expect(isPositionWithinBounds(
        { x: boundaries.minX, y: boundaries.minY },
        textDimensions,
        imageDimensions
      )).toBe(true);
      
      expect(isPositionWithinBounds(
        { x: boundaries.maxX, y: boundaries.maxY },
        textDimensions,
        imageDimensions
      )).toBe(true);
    });

    it('should return false for invalid parameters', () => {
      expect(isPositionWithinBounds(null, textDimensions, imageDimensions)).toBe(false);
      expect(isPositionWithinBounds({ x: 50, y: 50 }, null, imageDimensions)).toBe(false);
    });
  });

  describe('constrainPositionWithFeedback', () => {
    const textDimensions = { width: 100, height: 50 };
    const imageDimensions = { width: 800, height: 600 };

    it('should return position unchanged if within bounds', () => {
      const position = { x: 50, y: 50 };
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition).toEqual(position);
      expect(result.feedback.wasConstrained).toBe(false);
      expect(result.feedback.hitBoundaries.left).toBe(false);
      expect(result.feedback.hitBoundaries.right).toBe(false);
      expect(result.feedback.hitBoundaries.top).toBe(false);
      expect(result.feedback.hitBoundaries.bottom).toBe(false);
    });

    it('should constrain position and provide feedback for left boundary', () => {
      const position = { x: 2, y: 50 }; // Too far left
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition.x).toBeGreaterThan(position.x);
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.left).toBe(true);
      expect(result.feedback.hitBoundaries.right).toBe(false);
    });

    it('should constrain position and provide feedback for right boundary', () => {
      const position = { x: 98, y: 50 }; // Too far right
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition.x).toBeLessThan(position.x);
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.right).toBe(true);
      expect(result.feedback.hitBoundaries.left).toBe(false);
    });

    it('should constrain position and provide feedback for top boundary', () => {
      const position = { x: 50, y: 2 }; // Too far up
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition.y).toBeGreaterThan(position.y);
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.top).toBe(true);
      expect(result.feedback.hitBoundaries.bottom).toBe(false);
    });

    it('should constrain position and provide feedback for bottom boundary', () => {
      const position = { x: 50, y: 98 }; // Too far down
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition.y).toBeLessThan(position.y);
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.bottom).toBe(true);
      expect(result.feedback.hitBoundaries.top).toBe(false);
    });

    it('should handle multiple boundary hits', () => {
      const position = { x: 2, y: 2 }; // Too far left and up
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      expect(result.constrainedPosition.x).toBeGreaterThan(position.x);
      expect(result.constrainedPosition.y).toBeGreaterThan(position.y);
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.left).toBe(true);
      expect(result.feedback.hitBoundaries.top).toBe(true);
    });

    it('should handle custom padding', () => {
      const position = { x: 8, y: 8 }; // Within default padding but outside custom padding
      const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions, 10);
      
      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.constrainedPosition.x).toBeGreaterThan(position.x);
      expect(result.constrainedPosition.y).toBeGreaterThan(position.y);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => constrainPositionWithFeedback(null, textDimensions, imageDimensions))
        .toThrow('Invalid parameters: position, textDimensions, and imageDimensions are required');
    });
  });

  describe('Boundary constraint integration tests', () => {
    it('should maintain consistent behavior between validation and constraint functions', () => {
      const textDimensions = { width: 120, height: 60 };
      const imageDimensions = { width: 800, height: 600 };
      const position = { x: 10, y: 10 }; // Near edge
      
      // Check if position is within bounds
      const isWithinBounds = isPositionWithinBounds(position, textDimensions, imageDimensions);
      
      // Get constrained position
      const constraintResult = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
      
      // If original position was not within bounds, constraint should have been applied
      if (!isWithinBounds) {
        expect(constraintResult.feedback.wasConstrained).toBe(true);
      }
      
      // Constrained position should always be within bounds
      const constrainedIsWithinBounds = isPositionWithinBounds(
        constraintResult.constrainedPosition,
        textDimensions,
        imageDimensions
      );
      expect(constrainedIsWithinBounds).toBe(true);
    });

    it('should handle extreme text sizes gracefully', () => {
      const imageDimensions = { width: 400, height: 300 };
      
      // Very small text
      const smallTextDimensions = { width: 10, height: 5 };
      const smallTextResult = constrainPositionWithFeedback(
        { x: 1, y: 1 },
        smallTextDimensions,
        imageDimensions
      );
      expect(smallTextResult.constrainedPosition.x).toBeGreaterThan(0);
      expect(smallTextResult.constrainedPosition.y).toBeGreaterThan(0);
      
      // Very large text
      const largeTextDimensions = { width: 380, height: 280 }; // Almost full image
      const largeTextResult = constrainPositionWithFeedback(
        { x: 50, y: 50 },
        largeTextDimensions,
        imageDimensions
      );
      expect(largeTextResult.constrainedPosition.x).toBeGreaterThanOrEqual(0);
      expect(largeTextResult.constrainedPosition.x).toBeLessThanOrEqual(100);
    });

    it('should provide accurate boundary feedback for all edge cases', () => {
      const textDimensions = { width: 100, height: 50 };
      const imageDimensions = { width: 800, height: 600 };
      
      // Test all four corners
      const corners = [
        { position: { x: 1, y: 1 }, expectedBoundaries: ['left', 'top'] },
        { position: { x: 99, y: 1 }, expectedBoundaries: ['right', 'top'] },
        { position: { x: 1, y: 99 }, expectedBoundaries: ['left', 'bottom'] },
        { position: { x: 99, y: 99 }, expectedBoundaries: ['right', 'bottom'] }
      ];
      
      corners.forEach(({ position, expectedBoundaries }) => {
        const result = constrainPositionWithFeedback(position, textDimensions, imageDimensions);
        
        expectedBoundaries.forEach(boundary => {
          expect(result.feedback.hitBoundaries[boundary]).toBe(true);
        });
        
        // Other boundaries should not be hit
        const allBoundaries = ['left', 'right', 'top', 'bottom'];
        const otherBoundaries = allBoundaries.filter(b => !expectedBoundaries.includes(b));
        otherBoundaries.forEach(boundary => {
          expect(result.feedback.hitBoundaries[boundary]).toBe(false);
        });
      });
    });
  });
});