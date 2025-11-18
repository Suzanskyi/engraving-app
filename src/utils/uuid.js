import { v4 as uuidv4 } from 'uuid';

/**
 * UUID generation utility for creating unique request IDs
 */

/**
 * Generate a new UUID v4
 * @returns {string} - A new UUID v4 string
 */
export const generateUUID = () => {
  return uuidv4();
};

/**
 * Validate if a string is a valid UUID v4
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} - True if valid UUID v4, false otherwise
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
};

/**
 * Generate a short UUID (first 8 characters) for display purposes
 * @returns {string} - A shortened UUID for user-friendly display
 */
export const generateShortUUID = () => {
  return uuidv4().substring(0, 8);
};

export default {
  generateUUID,
  isValidUUID,
  generateShortUUID
};