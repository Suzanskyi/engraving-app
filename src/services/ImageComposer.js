import { 
  percentageToPixels, 
  calculateTextDimensions, 
  constrainPosition,
  normalizePosition 
} from '../utils/positioning.js';
import { 
  canvasMemoryManager, 
  performanceMonitor 
} from '../utils/performance.js';

/**
 * ImageComposer - Service for composing images with text overlays
 * Unified service for consistent rendering across preview and final output
 */
class ImageComposer {
  /**
   * Unified method for composing images with text overlays
   * Works for both real images and generated previews with consistent rendering
   * @param {Object} options - Composition options
   * @param {string} [options.imageUrl] - Base image URL (optional for preview mode)
   * @param {string} [options.description] - Text description for preview generation
   * @param {string} options.text - Text to overlay
   * @param {Object} options.position - Text position {x, y} in percentages
   * @param {string} options.font - Font family
   * @param {number} options.fontSize - Font size in pixels
   * @param {string} options.color - Text color (default: '#333')
   * @param {number} options.maxWidth - Maximum canvas width (default: 800)
   * @param {number} [options.width] - Canvas width for preview mode (default: 600)
   * @param {number} [options.height] - Canvas height for preview mode (default: 400)
   * @param {boolean} [options.isPreview] - Whether this is a preview generation
   * @returns {Promise<string>} - Data URL of the composed image
   */
  static async composeImage({
    imageUrl,
    description,
    text,
    position = { x: 50, y: 50 },
    font = 'Arial',
    fontSize = 24,
    color = '#333',
    maxWidth = 800,
    width = 600,
    height = 400,
    isPreview = false
  }) {
    return performanceMonitor.timeOperation('compose_image', () => {
      return new Promise((resolve, reject) => {
        // Use memory-managed canvas
        const canvas = canvasMemoryManager.getCanvas(width, height);
        const ctx = canvasMemoryManager.getOptimizedContext(canvas);
        
        try {
          if (isPreview || !imageUrl) {
            // Preview mode - generate background and render text
            this._setupPreviewCanvas(canvas, ctx, width, height, description);
            this._renderTextOverlay(ctx, text, position, font, fontSize, color, { width, height });
            
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            
            // Return canvas to pool
            canvasMemoryManager.returnCanvas(canvas);
            resolve(dataUrl);
          } else {
            // Image mode - load image and render text
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              try {
                const dimensions = this._setupImageCanvas(canvas, ctx, img, maxWidth);
                this._renderTextOverlay(ctx, text, position, font, fontSize, color, dimensions);
                
                const dataUrl = canvas.toDataURL('image/png', 0.9);
                
                // Return canvas to pool
                canvasMemoryManager.returnCanvas(canvas);
                resolve(dataUrl);
              } catch (error) {
                canvasMemoryManager.returnCanvas(canvas);
                reject(error);
              }
            };
            
            img.onerror = () => {
              canvasMemoryManager.returnCanvas(canvas);
              reject(new Error('Failed to load image'));
            };
            
            img.src = imageUrl;
          }
        } catch (error) {
          canvasMemoryManager.returnCanvas(canvas);
          reject(error);
        }
      });
    });
  }

  /**
   * Generate a thumbnail version of the composed image
   * @param {string} dataUrl - Original composed image data URL
   * @param {number} maxSize - Maximum thumbnail size (default: 200)
   * @returns {Promise<string>} - Thumbnail data URL
   */
  static async generateThumbnail(dataUrl, maxSize = 200) {
    return performanceMonitor.timeOperation('generate_thumbnail', () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate thumbnail dimensions
            const aspectRatio = img.height / img.width;
            let thumbWidth, thumbHeight;
            
            if (img.width > img.height) {
              thumbWidth = Math.min(img.width, maxSize);
              thumbHeight = thumbWidth * aspectRatio;
            } else {
              thumbHeight = Math.min(img.height, maxSize);
              thumbWidth = thumbHeight / aspectRatio;
            }
            
            // Use memory-managed canvas
            const canvas = canvasMemoryManager.getCanvas(thumbWidth, thumbHeight);
            const ctx = canvasMemoryManager.getOptimizedContext(canvas);
            
            // Draw scaled image with high quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Return canvas to pool
            canvasMemoryManager.returnCanvas(canvas);
            resolve(thumbnailUrl);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to generate thumbnail'));
        };
        
        img.src = dataUrl;
      });
    });
  }

  /**
   * Download the composed image
   * @param {string} dataUrl - Image data URL
   * @param {string} filename - Download filename (default: 'engraved-design.png')
   */
  static downloadImage(dataUrl, filename = 'engraved-design.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate a visual preview from text description
   * Uses the unified composeImage method for consistency
   * @param {Object} options - Generation options
   * @param {string} options.description - Text description of the object
   * @param {string} options.text - Text to overlay
   * @param {Object} options.position - Text position {x, y} in percentages
   * @param {string} options.font - Font family
   * @param {number} options.fontSize - Font size in pixels
   * @param {string} options.color - Text color (default: '#333')
   * @param {number} options.width - Canvas width (default: 600)
   * @param {number} options.height - Canvas height (default: 400)
   * @returns {Promise<string>} - Data URL of the generated preview
   */
  static async generateTextPreview(options) {
    return this.composeImage({
      ...options,
      isPreview: true
    });
  }

  /**
   * Setup canvas for preview mode with generated background
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string} description - Object description
   * @private
   */
  static _setupPreviewCanvas(canvas, ctx, width, height, description) {
    canvas.width = width;
    canvas.height = height;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw object representation based on description
    if (description) {
      this.drawObjectRepresentation(ctx, description, width, height);
      
      // Add descriptive text at the bottom
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Wrap description text
      const maxWidth = width - 40;
      const words = description.split(' ');
      let line = '';
      let y = height - 60;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, width / 2, y);
          line = words[n] + ' ';
          y += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, y);
    }
  }

  /**
   * Setup canvas for image mode with loaded image
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement} img - Loaded image
   * @param {number} maxWidth - Maximum canvas width
   * @returns {Object} Canvas dimensions {width, height}
   * @private
   */
  static _setupImageCanvas(canvas, ctx, img, maxWidth) {
    // Calculate canvas dimensions maintaining aspect ratio
    const aspectRatio = img.height / img.width;
    const canvasWidth = Math.min(img.width, maxWidth);
    const canvasHeight = canvasWidth * aspectRatio;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Draw the base image
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    
    return { width: canvasWidth, height: canvasHeight };
  }

  /**
   * Render text overlay with consistent styling and positioning
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to render
   * @param {Object} position - Text position {x, y} in percentages
   * @param {string} font - Font family
   * @param {number} fontSize - Font size in pixels
   * @param {string} color - Text color
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @private
   */
  static _renderTextOverlay(ctx, text, position, font, fontSize, color, dimensions) {
    if (!text || !text.trim()) {
      return;
    }

    // Normalize position to ensure it's within valid range
    const normalizedPosition = normalizePosition(position);
    
    // Get consistent font family
    const fontFamily = this.getFontFamily(font);
    
    // Configure text rendering
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Calculate text position using unified positioning utility
    const pixelPosition = percentageToPixels(normalizedPosition, dimensions);
    
    // Calculate text dimensions for background
    const textDimensions = calculateTextDimensions(text, fontFamily, fontSize, ctx);
    
    // Constrain position to keep text within bounds
    const constrainedPosition = constrainPosition(
      normalizedPosition, 
      textDimensions, 
      dimensions, 
      5 // 5% padding from edges
    );
    
    // Recalculate pixel position with constraints
    const finalPixelPosition = percentageToPixels(constrainedPosition, dimensions);
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      finalPixelPosition.x - textDimensions.width / 2 - 10,
      finalPixelPosition.y - textDimensions.height / 2 - 5,
      textDimensions.width + 20,
      textDimensions.height + 10
    );
    
    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(text, finalPixelPosition.x, finalPixelPosition.y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Draw a visual representation of the described object
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} description - Object description
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  static drawObjectRepresentation(ctx, description, width, height) {
    const centerX = width / 2;
    const centerY = height / 2 - 30; // Leave space for description text
    const desc = description.toLowerCase();
    
    // Set common styles
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    
    // Determine object type and draw accordingly
    if (desc.includes('mug') || desc.includes('cup')) {
      this.drawMug(ctx, centerX, centerY);
    } else if (desc.includes('phone') || desc.includes('mobile')) {
      this.drawPhone(ctx, centerX, centerY);
    } else if (desc.includes('laptop') || desc.includes('computer')) {
      this.drawLaptop(ctx, centerX, centerY);
    } else if (desc.includes('watch')) {
      this.drawWatch(ctx, centerX, centerY);
    } else if (desc.includes('bottle')) {
      this.drawBottle(ctx, centerX, centerY);
    } else if (desc.includes('pen') || desc.includes('pencil')) {
      this.drawPen(ctx, centerX, centerY);
    } else if (desc.includes('keychain') || desc.includes('key')) {
      this.drawKeychain(ctx, centerX, centerY);
    } else if (desc.includes('plate') || desc.includes('dish')) {
      this.drawPlate(ctx, centerX, centerY);
    } else {
      // Generic rectangular object
      this.drawGenericObject(ctx, centerX, centerY);
    }
  }

  /**
   * Get proper font family name for canvas rendering with consistent fallbacks
   * @param {string} font - Font name
   * @returns {string} - Canvas-compatible font family with fallbacks
   */
  static getFontFamily(font) {
    if (!font || typeof font !== 'string') {
      return 'Arial, sans-serif';
    }

    const fontMap = {
      'arial': 'Arial, sans-serif',
      'helvetica': 'Helvetica, Arial, sans-serif',
      'timesnewroman': 'Times New Roman, serif',
      'times': 'Times New Roman, serif',
      'georgia': 'Georgia, serif',
      'verdana': 'Verdana, sans-serif',
      'couriernew': 'Courier New, monospace',
      'courier': 'Courier New, monospace',
      'impact': 'Impact, sans-serif',
      'comicsansms': 'Comic Sans MS, cursive',
      'comicsans': 'Comic Sans MS, cursive',
      'tahoma': 'Tahoma, sans-serif',
      'trebuchetms': 'Trebuchet MS, sans-serif',
      'trebuchet': 'Trebuchet MS, sans-serif',
      'lucidasans': 'Lucida Sans, sans-serif',
      'lucida': 'Lucida Sans, sans-serif',
      'palatino': 'Palatino, serif'
    };
    
    const normalizedFont = font.toLowerCase().replace(/\s+/g, '');
    return fontMap[normalizedFont] || `${font}, Arial, sans-serif`;
  }

  // Object drawing methods
  static drawMug(ctx, x, y) {
    ctx.fillStyle = '#dee2e6';
    ctx.fillRect(x - 60, y - 40, 120, 80);
    ctx.strokeRect(x - 60, y - 40, 120, 80);
    
    // Handle
    ctx.beginPath();
    ctx.arc(x + 70, y, 25, -Math.PI/2, Math.PI/2, false);
    ctx.stroke();
  }

  static drawPhone(ctx, x, y) {
    ctx.fillStyle = '#343a40';
    ctx.fillRect(x - 40, y - 70, 80, 140);
    ctx.strokeRect(x - 40, y - 70, 80, 140);
    
    // Screen
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x - 35, y - 60, 70, 120);
  }

  static drawLaptop(ctx, x, y) {
    // Base
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x - 80, y + 10, 160, 20);
    ctx.strokeRect(x - 80, y + 10, 160, 20);
    
    // Screen
    ctx.fillStyle = '#495057';
    ctx.fillRect(x - 70, y - 50, 140, 60);
    ctx.strokeRect(x - 70, y - 50, 140, 60);
  }

  static drawWatch(ctx, x, y) {
    // Watch face
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Band
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x - 50, y - 10, 20, 20);
    ctx.fillRect(x + 30, y - 10, 20, 20);
  }

  static drawBottle(ctx, x, y) {
    // Body
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(x - 25, y - 30, 50, 80);
    ctx.strokeRect(x - 25, y - 30, 50, 80);
    
    // Neck
    ctx.fillRect(x - 10, y - 60, 20, 30);
    ctx.strokeRect(x - 10, y - 60, 20, 30);
  }

  static drawPen(ctx, x, y) {
    ctx.fillStyle = '#495057';
    ctx.fillRect(x - 5, y - 60, 10, 120);
    ctx.strokeRect(x - 5, y - 60, 10, 120);
    
    // Tip
    ctx.fillStyle = '#212529';
    ctx.fillRect(x - 3, y + 60, 6, 10);
  }

  static drawKeychain(ctx, x, y) {
    // Ring
    ctx.beginPath();
    ctx.arc(x, y - 20, 20, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Tag
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(x - 15, y + 10, 30, 20);
    ctx.strokeRect(x - 15, y + 10, 30, 20);
  }

  static drawPlate(ctx, x, y) {
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.ellipse(x, y, 80, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  static drawGenericObject(ctx, x, y) {
    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(x - 50, y - 30, 100, 60);
    ctx.strokeRect(x - 50, y - 30, 100, 60);
    
    // Add some detail lines
    ctx.beginPath();
    ctx.moveTo(x - 40, y - 20);
    ctx.lineTo(x + 40, y - 20);
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x + 40, y);
    ctx.moveTo(x - 40, y + 20);
    ctx.lineTo(x + 40, y + 20);
    ctx.stroke();
  }

  /**
   * Validate image URL and check if it's accessible
   * @param {string} imageUrl - Image URL to validate
   * @returns {Promise<boolean>} - True if image is valid and accessible
   */
  static async validateImage(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      img.src = imageUrl;
    });
  }
}

export default ImageComposer;