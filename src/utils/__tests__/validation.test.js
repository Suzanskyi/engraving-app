import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPosition,
  isValidFontSize,
  validateCustomerInfo,
  validateRequestData,
  sanitizeText,
  validateAndSanitizeRequest,
  validateTextContent,
  constrainFontSize,
  validateTextPosition
} from '../validation.js';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 50, y: 50 })).toBe(true);
      expect(isValidPosition({ x: 100, y: 100 })).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isValidPosition({ x: -1, y: 50 })).toBe(false);
      expect(isValidPosition({ x: 50, y: 101 })).toBe(false);
      expect(isValidPosition({ x: 'invalid', y: 50 })).toBe(false);
      expect(isValidPosition({})).toBe(false);
      expect(isValidPosition(null)).toBe(false);
    });
  });

  describe('isValidFontSize', () => {
    it('should return true for valid font sizes', () => {
      expect(isValidFontSize(12)).toBe(true);
      expect(isValidFontSize(24)).toBe(true);
      expect(isValidFontSize(72)).toBe(true);
    });

    it('should return false for invalid font sizes', () => {
      expect(isValidFontSize(11)).toBe(false);
      expect(isValidFontSize(73)).toBe(false);
      expect(isValidFontSize('24')).toBe(false);
      expect(isValidFontSize(null)).toBe(false);
    });
  });

  describe('validateCustomerInfo', () => {
    const validCustomerInfo = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234'
    };

    it('should return valid for correct customer info', () => {
      const result = validateCustomerInfo(validCustomerInfo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for missing name', () => {
      const result = validateCustomerInfo({ ...validCustomerInfo, name: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name is required and must be a non-empty string');
    });

    it('should return invalid for invalid email', () => {
      const result = validateCustomerInfo({ ...validCustomerInfo, email: 'invalid' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required and must be a valid email address');
    });

    it('should return invalid for long phone number', () => {
      const result = validateCustomerInfo({ 
        ...validCustomerInfo, 
        phone: '1'.repeat(21) 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('phone must be a string with maximum 20 characters');
    });

    it('should allow missing phone number', () => {
      const customerWithoutPhone = { name: 'John Doe', email: 'john@example.com' };
      const result = validateCustomerInfo(customerWithoutPhone);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequestData', () => {
    const validRequestData = {
      originalImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      customText: 'Test Text',
      textPosition: { x: 50, y: 30 },
      font: 'Arial',
      fontSize: 24,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      },
      comments: 'Test comments'
    };

    it('should return valid for correct request data', () => {
      const result = validateRequestData(validRequestData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for missing originalImage', () => {
      const dataWithoutOriginals = { ...validRequestData };
      delete dataWithoutOriginals.originalImage;
      delete dataWithoutOriginals.originalText;
      
      const result = validateRequestData(dataWithoutOriginals);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Either originalImage or originalText must be provided');
    });

    it('should return invalid for long customText', () => {
      const result = validateRequestData({ 
        ...validRequestData, 
        customText: 'a'.repeat(101) 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('customText must not exceed 100 characters');
    });

    it('should return invalid for invalid textPosition', () => {
      const result = validateRequestData({ 
        ...validRequestData, 
        textPosition: { x: -1, y: 101 } 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('textPosition must be an object with x and y coordinates (0-100)');
    });

    it('should return invalid for invalid fontSize', () => {
      const result = validateRequestData({ ...validRequestData, fontSize: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('fontSize must be a number between 12 and 72');
    });

    it('should allow missing comments', () => {
      const dataWithoutComments = { ...validRequestData };
      delete dataWithoutComments.comments;
      const result = validateRequestData(dataWithoutComments);
      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize HTML characters', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeText('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should handle non-string input', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(123)).toBe('');
    });
  });

  describe('validateAndSanitizeRequest', () => {
    const validRequestData = {
      originalImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      customText: '  <script>Test</script>  ',
      textPosition: { x: 50, y: 30 },
      font: 'Arial',
      fontSize: 24,
      customerInfo: {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        phone: '  555-1234  '
      },
      comments: '  Test <b>comments</b>  '
    };

    it('should validate and sanitize valid request data', () => {
      const result = validateAndSanitizeRequest(validRequestData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData.customText).toBe('&lt;script&gt;Test&lt;&#x2F;script&gt;');
      expect(result.sanitizedData.customerInfo.name).toBe('John Doe');
      expect(result.sanitizedData.customerInfo.email).toBe('john@example.com');
      expect(result.sanitizedData.customerInfo.phone).toBe('555-1234');
      expect(result.sanitizedData.comments).toBe('Test &lt;b&gt;comments&lt;&#x2F;b&gt;');
    });

    it('should return invalid for invalid request data', () => {
      const invalidData = { ...validRequestData, fontSize: 5 };
      const result = validateAndSanitizeRequest(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sanitizedData).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const dataWithoutOptionals = {
        ...validRequestData,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };
      delete dataWithoutOptionals.comments;
      
      const result = validateAndSanitizeRequest(dataWithoutOptionals);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.customerInfo.phone).toBeUndefined();
      expect(result.sanitizedData.comments).toBe('');
    });
  });

  describe('validateTextContent', () => {
    it('should return valid for acceptable text', () => {
      const result = validateTextContent('Hello World');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedText).toBe('Hello World');
    });

    it('should return invalid for text exceeding 100 characters', () => {
      const longText = 'a'.repeat(101);
      const result = validateTextContent(longText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text must not exceed 100 characters');
    });

    it('should return invalid for empty text', () => {
      const result = validateTextContent('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text cannot be empty');
    });

    it('should return invalid for non-string input', () => {
      const result = validateTextContent(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text must be a string');
      expect(result.sanitizedText).toBe('');
    });

    it('should detect control characters', () => {
      const textWithControlChars = 'Hello\x00World\x1F';
      const result = validateTextContent(textWithControlChars);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text contains invalid control characters');
    });

    it('should sanitize HTML in text', () => {
      const result = validateTextContent('<script>alert("xss")</script>');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle text at exactly 100 characters', () => {
      const exactText = 'a'.repeat(100);
      const result = validateTextContent(exactText);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('constrainFontSize', () => {
    it('should return font size within valid range unchanged', () => {
      expect(constrainFontSize(24)).toBe(24);
      expect(constrainFontSize(12)).toBe(12);
      expect(constrainFontSize(72)).toBe(72);
    });

    it('should constrain font size to minimum', () => {
      expect(constrainFontSize(5)).toBe(12);
      expect(constrainFontSize(11.9)).toBe(12);
    });

    it('should constrain font size to maximum', () => {
      expect(constrainFontSize(100)).toBe(72);
      expect(constrainFontSize(72.1)).toBe(72);
    });

    it('should round font size to nearest integer', () => {
      expect(constrainFontSize(24.7)).toBe(25);
      expect(constrainFontSize(24.3)).toBe(24);
    });

    it('should return default for invalid input', () => {
      expect(constrainFontSize('invalid')).toBe(24);
      expect(constrainFontSize(null)).toBe(24);
      expect(constrainFontSize(undefined)).toBe(24);
      expect(constrainFontSize(NaN)).toBe(24);
    });
  });

  describe('validateTextPosition', () => {
    const validTextDimensions = { width: 100, height: 30 };
    const validImageDimensions = { width: 800, height: 600 };

    it('should return valid for position within bounds', () => {
      const result = validateTextPosition(
        { x: 50, y: 50 },
        validTextDimensions,
        validImageDimensions
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for position outside bounds', () => {
      const result = validateTextPosition(
        { x: 5, y: 5 }, // Too close to edge
        validTextDimensions,
        validImageDimensions
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text position is outside image boundaries');
    });

    it('should constrain position to valid bounds', () => {
      const result = validateTextPosition(
        { x: 95, y: 95 }, // Too close to edge
        validTextDimensions,
        validImageDimensions
      );
      expect(result.constrainedPosition.x).toBeLessThan(95);
      expect(result.constrainedPosition.y).toBeLessThan(95);
    });

    it('should handle custom padding', () => {
      const result = validateTextPosition(
        { x: 8, y: 8 },
        validTextDimensions,
        validImageDimensions,
        10 // 10% padding
      );
      expect(result.isValid).toBe(false);
      expect(result.constrainedPosition.x).toBeGreaterThan(10);
      expect(result.constrainedPosition.y).toBeGreaterThan(10);
    });

    it('should return invalid for invalid position coordinates', () => {
      const result = validateTextPosition(
        { x: -10, y: 150 },
        validTextDimensions,
        validImageDimensions
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid position coordinates');
    });

    it('should return invalid for invalid text dimensions', () => {
      const result = validateTextPosition(
        { x: 50, y: 50 },
        { width: 'invalid', height: 30 },
        validImageDimensions
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid text dimensions');
    });

    it('should return invalid for invalid image dimensions', () => {
      const result = validateTextPosition(
        { x: 50, y: 50 },
        validTextDimensions,
        { width: 800, height: 'invalid' }
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid image dimensions');
    });

    it('should handle large text dimensions', () => {
      const largeTextDimensions = { width: 400, height: 200 }; // Half the image size
      const result = validateTextPosition(
        { x: 50, y: 50 },
        largeTextDimensions,
        validImageDimensions
      );
      // Should still be valid at center
      expect(result.isValid).toBe(true);
    });

    it('should handle very large text that cannot fit', () => {
      const oversizedTextDimensions = { width: 900, height: 700 }; // Larger than image
      const result = validateTextPosition(
        { x: 50, y: 50 },
        oversizedTextDimensions,
        validImageDimensions
      );
      // Should constrain to best possible position
      expect(result.constrainedPosition).toBeDefined();
      expect(result.constrainedPosition.x).toBeGreaterThanOrEqual(0);
      expect(result.constrainedPosition.x).toBeLessThanOrEqual(100);
    });
  });
});