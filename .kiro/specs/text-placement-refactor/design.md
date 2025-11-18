# Design Document

## Overview

This design focuses on simplifying and improving the text placement feature in the SuzEngrave application. The current implementation has several complexity issues including inconsistent positioning between preview and final output, performance problems during drag operations, and confusing user interactions. This refactor will create a cleaner, more predictable text placement system with unified positioning logic and better visual feedback.

## Architecture

### Current Issues Analysis
1. **Dual Positioning Systems**: The current code has separate positioning logic for the interactive overlay and final image generation
2. **Complex Event Handling**: Multiple event listeners and state management for dragging and resizing
3. **Inconsistent Coordinate Systems**: Different calculations for preview vs final output positioning
4. **Performance Issues**: Debounced image generation causes delays and confusion
5. **Font Rendering Inconsistencies**: Different font handling between preview and canvas rendering

### Simplified Architecture
The refactored system will use:
- **Unified Positioning System**: Single coordinate system for all text positioning
- **Simplified State Management**: Consolidated text state with immediate updates
- **Direct Canvas Rendering**: Real-time canvas updates instead of DOM overlays
- **Consistent Font Handling**: Unified font management across preview and final output

## Components and Interfaces

### 1. Enhanced TextOverlay Component

**Purpose**: Simplified text overlay with unified positioning

```javascript
class TextOverlay {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;
    this.isDragging = false;
    this.isResizing = false;
  }

  // Render text with consistent styling
  render(text, position, font, fontSize) {
    // Clear and redraw canvas
    // Apply consistent font rendering
    // Draw text with background
  }

  // Handle mouse interactions
  handleMouseDown(event) { }
  handleMouseMove(event) { }
  handleMouseUp(event) { }
}
```

### 2. Unified ImageComposer Service

**Current Issues**:
- Separate methods for preview and final generation
- Inconsistent font handling
- Different positioning calculations

**Refactored Interface**:
```javascript
class ImageComposer {
  // Single method for all image composition
  static composeImage(options) {
    // Unified positioning logic
    // Consistent font rendering
    // Same styling for preview and final
  }

  // Real-time preview generation
  static generateLivePreview(canvas, options) {
    // Immediate canvas updates
    // No debouncing delays
    // Same rendering as final output
  }
}
```

### 3. Simplified Step2Customize Component

**Refactored Structure**:
```javascript
const Step2Customize = ({ data, onUpdate, onNext, onPrev }) => {
  const canvasRef = useRef(null);
  const [textOverlay, setTextOverlay] = useState(null);

  // Simplified state management
  const handleTextChange = (newText) => {
    onUpdate({ customText: newText });
    textOverlay?.render(newText, data.textPosition, data.font, data.fontSize);
  };

  const handlePositionChange = (newPosition) => {
    onUpdate({ textPosition: newPosition });
    textOverlay?.render(data.customText, newPosition, data.font, data.fontSize);
  };

  // Direct canvas rendering instead of DOM overlays
  return (
    <div>
      <canvas ref={canvasRef} />
      <TextControls onTextChange={handleTextChange} />
    </div>
  );
};
```

## Data Models

### Unified Position Model
```javascript
// Single coordinate system for all positioning
{
  textPosition: {
    x: number,        // 0-100 percentage of image width
    y: number,        // 0-100 percentage of image height
    width: number,    // Text width in pixels (calculated)
    height: number    // Text height in pixels (calculated)
  },
  fontSize: number,   // 12-72 pixels
  font: string,       // Font family name
  customText: string  // Text content
}
```

### Canvas Rendering State
```javascript
{
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  imageData: ImageData,     // Base image data
  textMetrics: TextMetrics, // Calculated text dimensions
  isDirty: boolean          // Needs redraw flag
}
```

## Error Handling

### Input Validation
- **Text Length**: Limit to 100 characters with visual feedback
- **Position Bounds**: Automatically constrain text within image boundaries
- **Font Size**: Enforce min/max limits with smooth transitions
- **Image Loading**: Handle missing or corrupted images gracefully

### Rendering Errors
- **Font Loading**: Fallback to system fonts if custom fonts fail
- **Canvas Errors**: Graceful degradation to DOM-based preview
- **Memory Issues**: Optimize canvas operations for large images

### User Experience
- **Immediate Feedback**: No delays or loading states during interaction
- **Visual Indicators**: Clear hover states and drag cursors
- **Error Messages**: Helpful guidance for invalid operations

## Testing Strategy

### Unit Tests
- **Position Calculations**: Test coordinate transformations
- **Font Rendering**: Test consistent font application
- **Boundary Constraints**: Test text positioning limits
- **Canvas Operations**: Test rendering performance

### Integration Tests
- **Component Integration**: Test data flow between components
- **Event Handling**: Test mouse and touch interactions
- **State Management**: Test state updates and synchronization

### Visual Regression Tests
- **Rendering Consistency**: Compare preview vs final output
- **Cross-browser**: Test font rendering across browsers
- **Responsive Design**: Test on different screen sizes

## Implementation Plan

### Phase 1: Core Refactoring
1. **Unified Positioning System**
   - Create single coordinate transformation utility
   - Implement consistent percentage-based positioning
   - Remove duplicate positioning logic

2. **Canvas-Based Preview**
   - Replace DOM overlay with canvas rendering
   - Implement real-time text rendering
   - Add interactive mouse handling

3. **Simplified State Management**
   - Consolidate text-related state
   - Remove debouncing and complex event handling
   - Implement immediate updates

### Phase 2: Enhanced Interactions
1. **Improved User Interface**
   - Add visual feedback for interactions
   - Implement smooth animations
   - Add keyboard shortcuts for fine-tuning

2. **Performance Optimization**
   - Optimize canvas rendering for large images
   - Implement efficient redraw strategies
   - Add memory management for image data

### Phase 3: Advanced Features
1. **Enhanced Text Styling**
   - Add text color picker
   - Implement text effects (shadow, outline)
   - Add text alignment options

2. **Accessibility Improvements**
   - Add keyboard navigation
   - Implement screen reader support
   - Add high contrast mode

## Technical Specifications

### Canvas Rendering
```javascript
// Unified text rendering function
function renderText(ctx, text, position, style) {
  // Set font with proper fallbacks
  ctx.font = `${style.fontSize}px ${style.fontFamily}`;
  
  // Calculate text metrics
  const metrics = ctx.measureText(text);
  
  // Calculate position in pixels
  const x = (position.x / 100) * canvas.width;
  const y = (position.y / 100) * canvas.height;
  
  // Draw background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(x - metrics.width/2 - 10, y - style.fontSize/2 - 5, 
               metrics.width + 20, style.fontSize + 10);
  
  // Draw text
  ctx.fillStyle = style.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
```

### Mouse Interaction Handling
```javascript
// Simplified mouse event handling
function handleMouseEvent(event, canvas, textPosition, fontSize) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  
  // Constrain to image boundaries
  const constrainedX = Math.max(10, Math.min(90, x));
  const constrainedY = Math.max(10, Math.min(90, y));
  
  return { x: constrainedX, y: constrainedY };
}
```

### Font Management
```javascript
// Consistent font handling
const FONT_MAP = {
  'arial': 'Arial, sans-serif',
  'helvetica': 'Helvetica, Arial, sans-serif',
  'times': 'Times New Roman, serif',
  // ... other fonts
};

function getFontFamily(fontKey) {
  return FONT_MAP[fontKey] || 'Arial, sans-serif';
}
```

## Performance Considerations

### Canvas Optimization
- Use `requestAnimationFrame` for smooth animations
- Implement dirty region tracking to minimize redraws
- Cache text metrics to avoid repeated calculations
- Use off-screen canvas for complex operations

### Memory Management
- Dispose of canvas contexts when components unmount
- Limit image resolution for preview (max 800px width)
- Clear canvas data when switching between images
- Implement garbage collection for unused image data

### User Experience
- Maintain 60fps during drag operations
- Provide immediate visual feedback (< 16ms response time)
- Implement smooth transitions for size changes
- Add loading indicators only for operations > 100ms

## Browser Compatibility

### Supported Features
- Canvas 2D rendering (all modern browsers)
- Mouse and touch events (mobile support)
- Web fonts with fallbacks
- CSS transforms for smooth interactions

### Fallback Strategies
- DOM-based preview if canvas fails
- System fonts if web fonts don't load
- Basic positioning if advanced features fail
- Graceful degradation for older browsers

## Security Considerations

### Input Sanitization
- Escape HTML in text input to prevent XSS
- Validate font names against whitelist
- Limit text length to prevent memory issues
- Sanitize position values to prevent injection

### Image Handling
- Validate image formats and sizes
- Use CORS-enabled image loading
- Implement CSP headers for image sources
- Prevent malicious image uploads