/**
 * Services module exports for browser environment
 * Uses API client to communicate with backend server
 */

import ApiClient from './ApiClient.js';

// In browser environment, use API client
export const RequestStorage = new ApiClient();
export { default as ImageComposer } from './ImageComposer.js';