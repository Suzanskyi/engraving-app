import { describe, it, expect } from 'vitest';
import {
  validateTextContent,
  constrainFontSize,
  validateTextPosition
} from '../validation.js';
import {
  constrainPositionWithFeedback,
  isPositionWithinBounds,
  calculateSafeBoundaries
} from '../positioning.js';

describe('Boundary Constraints and Validation Integration', () => {
  describe('Text Content Validation', () => {
    it('should validate text length constraints', () => {
      // Valid text
      const validResult = validateTextContent('Hello World');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Text too long
      const longResult = validateTextContent('a'.repeat(101));
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors).toContain('Text must not exceed 100 characters');

      // Empty text
      const emptyResult = validateTextContent('   ');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Text cannot be empty');
    });

    it('should detect and handle special characters', () => {
      const result = validateTextContent('Hello\x00World');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text contains invalid control characters');
    });

    it('should sanitize HTML content', () => {
      const result = validateTextContent('<script>alert("xss")</script>');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
  });

  describe('Font Size Constraints', () => {
    it('should constrain font size to valid range', () => {
      expect(constrainFontSize(8)).toBe(12);   // Below minimum
      expect(constrainFontSize(24)).toBe(24);  // Valid
      expect(constrainFontSize(80)).toBe(72);  // Above maximum
      expect(constrainFontSize(24.7)).toBe(25); // Rounded
    });

    it('should handle invalid font size input', () => {
      expect(constrainFontSize('invalid')).toBe(24);
      expect(constrainFontSize(null)).toBe(24);
      expect(constrainFontSize(NaN)).toBe(24);
    });
  });

  describe('Position Boundary Constraints', () => {
    const textDimensions = { width: 100, height: 50 };
    const imageDimensions = { width: 800, height: 600 };

    it('should calculate safe boundaries correctly', () => {
      const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, 5);
      
      expect(boundaries.minX).toBeGreaterThan(5);
      expect(boundaries.maxX).toBeLessThan(95);
      expect(boundaries.minY).toBeGreaterThan(5);
      expect(boundaries.maxY).toBeLessThan(95);
    });

    it('should detect when position is within bounds', () => {
      expect(isPositionWithinBounds({ x: 50, y: 50 }, textDimensions, imageDimensions)).toBe(true);
      expect(isPositionWithinBounds({ x: 5, y: 5 }, textDimensions, imageDimensions)).toBe(false);
    });

    it('should constrain position and provide feedback', () => {
      const result = constrainPositionWithFeedback(
        { x: 2, y: 98 }, // Too close to left and bottom edges
        textDimensions,
        imageDimensions
      );

      expect(result.feedback.wasConstrained).toBe(true);
      expect(result.feedback.hitBoundaries.left).toBe(true);
      expect(result.feedback.hitBoundaries.bottom).toBe(true);
      expect(result.constrainedPosition.x).toBeGreaterThan(2);
      expect(result.constrainedPosition.y).toBeLessThan(98);
    });
  });

  describe('Integrated Validation Workflow', () => {
    it('should validate complete text placement scenario', () => {
      const text = 'Hello World';
      const fontSize = 24;
      const position = { x: 10, y: 10 };
      const textDimensions = { width: 120, height: 30 };
      const imageDimensions = { width: 800, height: 600 };

      // Validate text content
      const textValidation = validateTextContent(text);
      expect(textValidation.isValid).toBe(true);

      // Constrain font size
      const constrainedFontSize = constrainFontSize(fontSize);
      expect(constrainedFontSize).toBe(24);

      // Validate and constrain position
      const positionValidation = validateTextPosition(
        position,
        textDimensions,
        imageDimensions
      );
      
      // Position should be constrained due to being too close to edges
      expect(positionValidation.isValid).toBe(false);
      expect(positionValidation.constrainedPosition.x).toBeGreaterThanOrEqual(position.x);
      expect(positionValidation.constrainedPosition.y).toBeGreaterThanOrEqual(position.y);
    });

    it('should handle edge case with very large text', () => {
      const text = 'Very Long Text That Might Not Fit';
      const fontSize = 72; // Maximum size
      const position = { x: 50, y: 50 };
      const textDimensions = { width: 600, height: 80 }; // Large text
      const imageDimensions = { width: 800, height: 600 };

      // Text should be valid
      const textValidation = validateTextContent(text);
      expect(textValidation.isValid).toBe(true);

      // Font size should be at maximum
      const constrainedFontSize = constrainFontSize(fontSize);
      expect(constrainedFontSize).toBe(72);

      // Position should be constrained to fit large text
      const constraintResult = constrainPositionWithFeedback(
        position,
        textDimensions,
        imageDimensions
      );

      // Should be constrained to ensure text fits
      expect(constraintResult.constrainedPosition).toBeDefined();
      expect(isPositionWithinBounds(
        constraintResult.constrainedPosition,
        textDimensions,
        imageDimensions
      )).toBe(true);
    });

    it('should handle minimum font size with small image', () => {
      const text = 'Small';
      const fontSize = 8; // Below minimum
      const position = { x: 50, y: 50 };
      const textDimensions = { width: 30, height: 12 };
      const imageDimensions = { width: 200, height: 150 }; // Small image

      // Font size should be constrained to minimum
      const constrainedFontSize = constrainFontSize(fontSize);
      expect(constrainedFontSize).toBe(12);

      // Position should be valid in center of small image
      expect(isPositionWithinBounds(
        position,
        textDimensions,
        imageDimensions
      )).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid input gracefully', () => {
      // Invalid text
      expect(() => validateTextContent(null)).not.toThrow();
      
      // Invalid font size
      expect(() => constrainFontSize(undefined)).not.toThrow();
      
      // Invalid position
      expect(() => isPositionWithinBounds(null, { width: 100, height: 50 }, { width: 800, height: 600 })).not.toThrow();
    });

    it('should handle extreme boundary conditions', () => {
      const textDimensions = { width: 1000, height: 800 }; // Larger than image
      const imageDimensions = { width: 800, height: 600 };
      
      // Should still provide valid constraints even for oversized text
      const result = constrainPositionWithFeedback(
        { x: 50, y: 50 },
        textDimensions,
        imageDimensions
      );
      
      expect(result.constrainedPosition).toBeDefined();
      expect(result.constrainedPosition.x).toBeGreaterThanOrEqual(0);
      expect(result.constrainedPosition.x).toBeLessThanOrEqual(100);
      expect(result.constrainedPosition.y).toBeGreaterThanOrEqual(0);
      expect(result.constrainedPosition.y).toBeLessThanOrEqual(100);
    });
  });
});