import { describe, it, expect } from 'vitest';
import { generateUUID, isValidUUID, generateShortUUID } from '../uuid.js';

describe('UUID Utilities', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate UUIDs of correct length', () => {
      const uuid = generateUUID();
      expect(uuid).toHaveLength(36);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      const validUUID = generateUUID();
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should return false for invalid UUID format', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
    });

    it('should return false for UUID v1 format', () => {
      const uuidv1Format = '12345678-1234-1234-1234-123456789012';
      expect(isValidUUID(uuidv1Format)).toBe(false);
    });

    it('should return true for valid UUID v4 with different cases', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid.toLowerCase())).toBe(true);
      expect(isValidUUID(uuid.toUpperCase())).toBe(true);
    });
  });

  describe('generateShortUUID', () => {
    it('should generate a short UUID of 8 characters', () => {
      const shortUUID = generateShortUUID();
      expect(shortUUID).toHaveLength(8);
    });

    it('should generate unique short UUIDs', () => {
      const shortUUID1 = generateShortUUID();
      const shortUUID2 = generateShortUUID();
      expect(shortUUID1).not.toBe(shortUUID2);
    });

    it('should generate hexadecimal characters only', () => {
      const shortUUID = generateShortUUID();
      expect(shortUUID).toMatch(/^[0-9a-f]{8}$/i);
    });
  });
});