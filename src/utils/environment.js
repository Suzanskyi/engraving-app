/**
 * Environment detection utilities
 * Helps determine if we're running in browser vs Node.js environment
 */

/**
 * Check if we're running in a browser environment
 * @returns {boolean} True if running in browser
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if we're running in a Node.js environment
 * @returns {boolean} True if running in Node.js
 */
export function isNode() {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

/**
 * Check if PostgreSQL modules are available
 * @returns {boolean} True if PostgreSQL can be used
 */
export function isPostgreSQLAvailable() {
  try {
    // Try to access Node.js modules that PostgreSQL needs
    return isNode() && typeof require !== 'undefined';
  } catch (error) {
    return false;
  }
}

/**
 * Get the current environment type
 * @returns {string} 'browser', 'node', or 'unknown'
 */
export function getEnvironment() {
  if (isBrowser()) return 'browser';
  if (isNode()) return 'node';
  return 'unknown';
}