/**
 * Unified positioning utility for consistent coordinate transformations
 * Handles percentage-based positioning that works across different image sizes
 */

/**
 * Convert percentage-based position to pixel coordinates
 * @param {Object} percentagePosition - Position as percentage {x: 0-100, y: 0-100}
 * @param {Object} imageDimensions - Image dimensions {width, height}
 * @returns {Object} Pixel coordinates {x, y}
 */
export function percentageToPixels(percentagePosition, imageDimensions) {
  if (!percentagePosition || !imageDimensions) {
    throw new Error('Invalid parameters: percentagePosition and imageDimensions are required');
  }

  const { x: percentX, y: percentY } = percentagePosition;
  const { width, height } = imageDimensions;

  if (typeof percentX !== 'number' || typeof percentY !== 'number') {
    throw new Error('Position coordinates must be numbers');
  }

  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    throw new Error('Image dimensions must be positive numbers');
  }

  return {
    x: (percentX / 100) * width,
    y: (percentY / 100) * height
  };
}

/**
 * Convert pixel coordinates to percentage-based position
 * @param {Object} pixelPosition - Position in pixels {x, y}
 * @param {Object} imageDimensions - Image dimensions {width, height}
 * @returns {Object} Percentage coordinates {x: 0-100, y: 0-100}
 */
export function pixelsToPercentage(pixelPosition, imageDimensions) {
  if (!pixelPosition || !imageDimensions) {
    throw new Error('Invalid parameters: pixelPosition and imageDimensions are required');
  }

  const { x: pixelX, y: pixelY } = pixelPosition;
  const { width, height } = imageDimensions;

  if (typeof pixelX !== 'number' || typeof pixelY !== 'number') {
    throw new Error('Position coordinates must be numbers');
  }

  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    throw new Error('Image dimensions must be positive numbers');
  }

  return {
    x: (pixelX / width) * 100,
    y: (pixelY / height) * 100
  };
}

/**
 * Constrain position to stay within image boundaries
 * @param {Object} position - Position as percentage {x: 0-100, y: 0-100}
 * @param {Object} textDimensions - Text dimensions {width, height} in pixels
 * @param {Object} imageDimensions - Image dimensions {width, height} in pixels
 * @param {number} padding - Minimum padding from edges as percentage (default: 5)
 * @returns {Object} Constrained position {x: 0-100, y: 0-100}
 */
export function constrainPosition(position, textDimensions, imageDimensions, padding = 5) {
  if (!position || !textDimensions || !imageDimensions) {
    throw new Error('Invalid parameters: position, textDimensions, and imageDimensions are required');
  }

  const { x, y } = position;
  const { width: textWidth, height: textHeight } = textDimensions;
  const { width: imageWidth, height: imageHeight } = imageDimensions;

  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('Position coordinates must be numbers');
  }

  if (typeof padding !== 'number' || padding < 0 || padding > 50) {
    throw new Error('Padding must be a number between 0 and 50');
  }

  // Calculate text dimensions as percentage of image
  const textWidthPercent = (textWidth / imageWidth) * 100;
  const textHeightPercent = (textHeight / imageHeight) * 100;

  // Calculate boundaries considering text size and padding
  const minX = padding + (textWidthPercent / 2);
  const maxX = 100 - padding - (textWidthPercent / 2);
  const minY = padding + (textHeightPercent / 2);
  const maxY = 100 - padding - (textHeightPercent / 2);

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y))
  };
}

/**
 * Calculate text dimensions for given font and text
 * @param {string} text - Text content
 * @param {string} fontFamily - Font family name
 * @param {number} fontSize - Font size in pixels
 * @param {CanvasRenderingContext2D} context - Canvas context for measurement
 * @returns {Object} Text dimensions {width, height}
 */
export function calculateTextDimensions(text, fontFamily, fontSize, context) {
  if (!text || !fontFamily || !fontSize || !context) {
    throw new Error('Invalid parameters: text, fontFamily, fontSize, and context are required');
  }

  if (typeof text !== 'string') {
    throw new Error('Text must be a string');
  }

  if (typeof fontSize !== 'number' || fontSize <= 0) {
    throw new Error('Font size must be a positive number');
  }

  // Set font for measurement
  const originalFont = context.font;
  context.font = `${fontSize}px ${fontFamily}`;

  try {
    const metrics = context.measureText(text);
    
    // Calculate height based on font size and metrics
    const height = fontSize;
    const width = metrics.width;

    return { width, height };
  } finally {
    // Restore original font
    context.font = originalFont;
  }
}

/**
 * Normalize position to ensure it's within valid percentage range
 * @param {Object} position - Position {x, y}
 * @returns {Object} Normalized position {x: 0-100, y: 0-100}
 */
export function normalizePosition(position) {
  if (!position) {
    throw new Error('Position is required');
  }

  const { x, y } = position;

  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('Position coordinates must be numbers');
  }

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}

/**
 * Scale position from one image size to another while maintaining relative positioning
 * @param {Object} position - Original position as percentage {x: 0-100, y: 0-100}
 * @param {Object} originalDimensions - Original image dimensions {width, height}
 * @param {Object} newDimensions - New image dimensions {width, height}
 * @returns {Object} Scaled position {x: 0-100, y: 0-100}
 */
export function scalePosition(position, originalDimensions, newDimensions) {
  if (!position || !originalDimensions || !newDimensions) {
    throw new Error('Invalid parameters: position, originalDimensions, and newDimensions are required');
  }

  // Since we're using percentage-based positioning, the position remains the same
  // regardless of image dimensions. This function exists for consistency and
  // future extensibility if aspect ratio adjustments are needed.
  
  const { x, y } = position;
  
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('Position coordinates must be numbers');
  }

  // For now, return the same position since percentage-based positioning
  // automatically scales with image dimensions
  return normalizePosition({ x, y });
}

/**
 * Create a default centered position
 * @returns {Object} Centered position {x: 50, y: 50}
 */
export function createCenteredPosition() {
  return { x: 50, y: 50 };
}

/**
 * Check if a position is valid (within 0-100 range)
 * @param {Object} position - Position to validate {x, y}
 * @returns {boolean} True if position is valid
 */
export function isValidPercentagePosition(position) {
  if (!position || typeof position !== 'object') {
    return false;
  }

  const { x, y } = position;
  
  return (
    typeof x === 'number' && 
    typeof y === 'number' && 
    x >= 0 && x <= 100 && 
    y >= 0 && y <= 100
  );
}

/**
 * Calculate the safe positioning boundaries for text within an image
 * @param {Object} textDimensions - Text dimensions {width, height} in pixels
 * @param {Object} imageDimensions - Image dimensions {width, height} in pixels
 * @param {number} padding - Minimum padding from edges as percentage (default: 5)
 * @returns {Object} Safe boundaries {minX, maxX, minY, maxY} as percentages
 */
export function calculateSafeBoundaries(textDimensions, imageDimensions, padding = 5) {
  if (!textDimensions || !imageDimensions) {
    throw new Error('Invalid parameters: textDimensions and imageDimensions are required');
  }

  const { width: textWidth, height: textHeight } = textDimensions;
  const { width: imageWidth, height: imageHeight } = imageDimensions;

  if (typeof padding !== 'number' || padding < 0 || padding > 50) {
    throw new Error('Padding must be a number between 0 and 50');
  }

  // Calculate text dimensions as percentage of image
  const textWidthPercent = (textWidth / imageWidth) * 100;
  const textHeightPercent = (textHeight / imageHeight) * 100;

  // Calculate boundaries considering text size and padding
  const minX = padding + (textWidthPercent / 2);
  const maxX = 100 - padding - (textWidthPercent / 2);
  const minY = padding + (textHeightPercent / 2);
  const maxY = 100 - padding - (textHeightPercent / 2);

  return {
    minX: Math.max(0, minX),
    maxX: Math.min(100, maxX),
    minY: Math.max(0, minY),
    maxY: Math.min(100, maxY)
  };
}

/**
 * Check if text position is within safe boundaries
 * @param {Object} position - Position as percentage {x: 0-100, y: 0-100}
 * @param {Object} textDimensions - Text dimensions {width, height} in pixels
 * @param {Object} imageDimensions - Image dimensions {width, height} in pixels
 * @param {number} padding - Minimum padding from edges as percentage (default: 5)
 * @returns {boolean} True if position is within safe boundaries
 */
export function isPositionWithinBounds(position, textDimensions, imageDimensions, padding = 5) {
  try {
    const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, padding);
    const { x, y } = position;
    
    return (
      x >= boundaries.minX && 
      x <= boundaries.maxX && 
      y >= boundaries.minY && 
      y <= boundaries.maxY
    );
  } catch (error) {
    return false;
  }
}

/**
 * Smoothly constrain position to stay within boundaries with visual feedback
 * @param {Object} position - Position as percentage {x: 0-100, y: 0-100}
 * @param {Object} textDimensions - Text dimensions {width, height} in pixels
 * @param {Object} imageDimensions - Image dimensions {width, height} in pixels
 * @param {number} padding - Minimum padding from edges as percentage (default: 5)
 * @returns {Object} Result with constrainedPosition and feedback
 */
export function constrainPositionWithFeedback(position, textDimensions, imageDimensions, padding = 5) {
  if (!position || !textDimensions || !imageDimensions) {
    throw new Error('Invalid parameters: position, textDimensions, and imageDimensions are required');
  }

  const boundaries = calculateSafeBoundaries(textDimensions, imageDimensions, padding);
  const { x, y } = position;
  
  const constrainedX = Math.max(boundaries.minX, Math.min(boundaries.maxX, x));
  const constrainedY = Math.max(boundaries.minY, Math.min(boundaries.maxY, y));
  
  const wasConstrained = (constrainedX !== x || constrainedY !== y);
  
  // Provide feedback about which boundaries were hit
  const feedback = {
    wasConstrained,
    hitBoundaries: {
      left: constrainedX === boundaries.minX && x < boundaries.minX,
      right: constrainedX === boundaries.maxX && x > boundaries.maxX,
      top: constrainedY === boundaries.minY && y < boundaries.minY,
      bottom: constrainedY === boundaries.maxY && y > boundaries.maxY
    }
  };
  
  return {
    constrainedPosition: { x: constrainedX, y: constrainedY },
    feedback
  };
}