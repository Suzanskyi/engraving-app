/**
 * Data validation utilities for engraving request objects
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validate text position coordinates
 * @param {Object} position - Position object with x and y properties
 * @returns {boolean} - True if valid position
 */
export const isValidPosition = (position) => {
  if (!position || typeof position !== 'object') {
    return false;
  }
  
  const { x, y } = position;
  return typeof x === 'number' && x >= 0 && x <= 100 &&
         typeof y === 'number' && y >= 0 && y <= 100;
};

/**
 * Validate font size
 * @param {number} fontSize - Font size to validate
 * @returns {boolean} - True if valid font size (12-72px)
 */
export const isValidFontSize = (fontSize) => {
  return typeof fontSize === 'number' && fontSize >= 12 && fontSize <= 72;
};

/**
 * Validate text content for length and special characters
 * @param {string} text - Text to validate
 * @returns {Object} - Validation result with isValid, errors, and sanitizedText
 */
export const validateTextContent = (text) => {
  const errors = [];
  
  if (typeof text !== 'string') {
    return { 
      isValid: false, 
      errors: ['Text must be a string'], 
      sanitizedText: '' 
    };
  }
  
  // Check text length (max 100 characters)
  if (text.length > 100) {
    errors.push('Text must not exceed 100 characters');
  }
  
  // Check for empty text after trimming
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    errors.push('Text cannot be empty');
  }
  
  // Check for potentially problematic characters
  const problematicChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (problematicChars.test(text)) {
    errors.push('Text contains invalid control characters');
  }
  
  // Sanitize the text
  const sanitizedText = sanitizeText(trimmedText);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedText
  };
};

/**
 * Constrain font size to valid range with smooth transitions
 * @param {number} fontSize - Font size to constrain
 * @returns {number} - Constrained font size (12-72px)
 */
export const constrainFontSize = (fontSize) => {
  if (typeof fontSize !== 'number' || isNaN(fontSize)) {
    return 24; // Default font size
  }
  
  return Math.max(12, Math.min(72, Math.round(fontSize)));
};

/**
 * Validate text positioning within image boundaries
 * @param {Object} position - Position {x, y} as percentage
 * @param {Object} textDimensions - Text dimensions {width, height} in pixels
 * @param {Object} imageDimensions - Image dimensions {width, height} in pixels
 * @param {number} padding - Minimum padding from edges as percentage (default: 5)
 * @returns {Object} - Validation result with isValid, errors, and constrainedPosition
 */
export const validateTextPosition = (position, textDimensions, imageDimensions, padding = 5) => {
  const errors = [];
  
  if (!isValidPosition(position)) {
    return {
      isValid: false,
      errors: ['Invalid position coordinates'],
      constrainedPosition: { x: 50, y: 50 }
    };
  }
  
  if (!textDimensions || typeof textDimensions.width !== 'number' || typeof textDimensions.height !== 'number') {
    errors.push('Invalid text dimensions');
  }
  
  if (!imageDimensions || typeof imageDimensions.width !== 'number' || typeof imageDimensions.height !== 'number') {
    errors.push('Invalid image dimensions');
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      constrainedPosition: position
    };
  }
  
  // Calculate text dimensions as percentage of image
  const textWidthPercent = (textDimensions.width / imageDimensions.width) * 100;
  const textHeightPercent = (textDimensions.height / imageDimensions.height) * 100;
  
  // Calculate boundaries considering text size and padding
  const minX = padding + (textWidthPercent / 2);
  const maxX = 100 - padding - (textWidthPercent / 2);
  const minY = padding + (textHeightPercent / 2);
  const maxY = 100 - padding - (textHeightPercent / 2);
  
  // Check if position is within bounds
  const { x, y } = position;
  const isWithinBounds = x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  // Constrain position if needed
  const constrainedPosition = {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  };
  
  if (!isWithinBounds) {
    errors.push('Text position is outside image boundaries');
  }
  
  return {
    isValid: isWithinBounds,
    errors,
    constrainedPosition
  };
};

/**
 * Validate customer information object
 * @param {Object} customerInfo - Customer info to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateCustomerInfo = (customerInfo) => {
  const errors = [];
  
  if (!customerInfo || typeof customerInfo !== 'object') {
    return { isValid: false, errors: ['customerInfo must be an object'] };
  }
  
  const { name, email, phone } = customerInfo;
  
  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  } else if (name.length > 100) {
    errors.push('name must not exceed 100 characters');
  }
  
  // Email validation
  if (!email || !isValidEmail(email)) {
    errors.push('email is required and must be a valid email address');
  }
  
  // Phone validation (optional)
  if (phone && (typeof phone !== 'string' || phone.length > 20)) {
    errors.push('phone must be a string with maximum 20 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate complete request data
 * @param {Object} requestData - Request data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateRequestData = (requestData) => {
  const errors = [];
  
  if (!requestData || typeof requestData !== 'object') {
    return { isValid: false, errors: ['Request data must be an object'] };
  }
  
  // Original image validation (optional)
  if (requestData.originalImage && typeof requestData.originalImage !== 'string') {
    errors.push('originalImage must be a string if provided');
  }
  
  // Original text validation (optional, alternative to image)
  if (requestData.originalText && typeof requestData.originalText !== 'string') {
    errors.push('originalText must be a string if provided');
  }
  
  // At least one of originalImage or originalText must be provided
  if (!requestData.originalImage && !requestData.originalText) {
    errors.push('Either originalImage or originalText must be provided');
  }
  
  // Custom text validation
  if (!requestData.customText || typeof requestData.customText !== 'string') {
    errors.push('customText is required and must be a string');
  } else if (requestData.customText.length > 100) {
    errors.push('customText must not exceed 100 characters');
  }
  
  // Text position validation
  if (!isValidPosition(requestData.textPosition)) {
    errors.push('textPosition must be an object with x and y coordinates (0-100)');
  }
  
  // Font validation
  if (!requestData.font || typeof requestData.font !== 'string') {
    errors.push('font is required and must be a string');
  }
  
  // Font size validation
  if (!isValidFontSize(requestData.fontSize)) {
    errors.push('fontSize must be a number between 12 and 72');
  }
  
  // Customer info validation
  const customerValidation = validateCustomerInfo(requestData.customerInfo);
  if (!customerValidation.isValid) {
    errors.push(...customerValidation.errors.map(err => `customerInfo.${err}`));
  }
  
  // Comments validation (optional)
  if (requestData.comments && 
      (typeof requestData.comments !== 'string' || requestData.comments.length > 500)) {
    errors.push('comments must be a string with maximum 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize text input to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validate and sanitize request data
 * @param {Object} requestData - Request data to validate and sanitize
 * @returns {Object} - Result with isValid, errors, and sanitizedData
 */
export const validateAndSanitizeRequest = (requestData) => {
  // First sanitize the data
  const sanitizedData = {
    ...requestData,
    customText: requestData.customText ? sanitizeText(requestData.customText) : '',
    originalText: requestData.originalText ? sanitizeText(requestData.originalText) : undefined,
    customerInfo: {
      ...requestData.customerInfo,
      name: requestData.customerInfo?.name ? sanitizeText(requestData.customerInfo.name) : '',
      email: requestData.customerInfo?.email ? requestData.customerInfo.email.trim().toLowerCase() : '',
      phone: requestData.customerInfo?.phone ? sanitizeText(requestData.customerInfo.phone) : undefined
    },
    comments: requestData.comments ? sanitizeText(requestData.comments) : ''
  };
  
  // Then validate the sanitized data
  const validation = validateRequestData(sanitizedData);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors,
      sanitizedData: null
    };
  }
  
  return {
    isValid: true,
    errors: [],
    sanitizedData
  };
};

export default {
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
};