# Design Document

## Overview

SuzEngrave is a React-based engraving request management system that extends the existing 3-step workflow (Upload → Customize → Submit) with enhanced text customization features and an in-memory request storage system. The application allows users to upload objects, place and customize text with various fonts and sizes, and submit requests that are stored for tracking and processing.

## Architecture

### Current Architecture
The application follows a component-based React architecture with:
- **App.jsx**: Main application container managing state and step navigation
- **Step Components**: Modular components for each workflow step
- **Styled Components**: CSS-in-JS styling approach
- **State Management**: Local React state with prop drilling

### Enhanced Architecture
The design extends the current architecture with:
- **Request Storage Service**: In-memory database for storing engraving requests
- **Enhanced Text Customization**: Extended font selection and sizing controls
- **Request Management**: Utilities for viewing and managing stored requests

## Components and Interfaces

### 1. Request Storage Service (`src/services/RequestStorage.js`)

**Purpose**: Manages in-memory storage of engraving requests

**Interface**:
```javascript
class RequestStorage {
  // Store a new engraving request
  static storeRequest(requestData) -> { id, timestamp, ...requestData }
  
  // Retrieve all stored requests
  static getAllRequests() -> Array<Request>
  
  // Retrieve a specific request by ID
  static getRequestById(id) -> Request | null
  
  // Get request statistics
  static getRequestStats() -> { total, recent }
}
```

**Data Structure**:
```javascript
{
  id: string,           // Unique identifier (UUID)
  timestamp: Date,      // Submission timestamp
  originalImage: string, // Base64 image data
  customText: string,   // User's engraving text
  textPosition: { x: number, y: number }, // Text position (%)
  font: string,         // Selected font family
  fontSize: number,     // Font size in pixels
  customerInfo: {       // Customer contact details
    name: string,
    email: string,
    phone: string
  },
  comments: string,     // Additional comments
  status: string        // Request status (pending, processing, completed)
}
```

### 2. Enhanced Step2Customize Component

**Current Features**:
- Text input and positioning
- Basic font selection (12 fonts)
- Drag-and-drop text positioning
- Resize handles for text sizing

**Enhancements**:
- Expanded font library (20+ fonts)
- Font preview in dropdown
- Size constraints (min: 12px, max: 72px)
- Real-time preview updates
- Improved font rendering

**Font Selection**:
```javascript
const fonts = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Impact', 'Comic Sans MS', 'Tahoma', 'Trebuchet MS',
  'Lucida Sans', 'Palatino', 'Garamond', 'Book Antiqua', 'Century Gothic',
  'Franklin Gothic Medium', 'Lucida Console', 'Monaco', 'Consolas', 'Roboto'
];
```

### 3. Enhanced Step3Submit Component

**Current Features**:
- Customer information form
- Order summary display
- Final preview
- Basic submission handling

**Enhancements**:
- Integration with RequestStorage service
- Request ID generation and display
- Success confirmation with request details
- Request tracking information

### 4. Request Management Interface (`src/components/RequestManager.jsx`)

**Purpose**: Administrative interface for viewing stored requests

**Features**:
- List all stored requests
- Search and filter requests
- View request details
- Request status management
- Export functionality

## Data Models

### Request Model
```javascript
{
  id: string,                    // UUID v4
  timestamp: Date,               // ISO string
  originalImage: string,         // Base64 data URL
  customText: string,            // Max 100 characters
  textPosition: {
    x: number,                   // 0-100 (percentage)
    y: number                    // 0-100 (percentage)
  },
  font: string,                  // Font family name
  fontSize: number,              // 12-72 pixels
  customerInfo: {
    name: string,                // Required, max 100 chars
    email: string,               // Required, valid email
    phone: string                // Optional, max 20 chars
  },
  comments: string,              // Optional, max 500 chars
  status: 'pending' | 'processing' | 'completed'
}
```

### Storage Schema
```javascript
// In-memory storage structure
{
  requests: Map<string, Request>,  // Key: request ID, Value: request object
  metadata: {
    totalRequests: number,
    lastRequestTime: Date,
    requestsByStatus: {
      pending: number,
      processing: number,
      completed: number
    }
  }
}
```

## Error Handling

### Storage Errors
- **Memory Limit**: Implement request limit (max 1000 requests)
- **Data Validation**: Validate all request data before storage
- **Duplicate Prevention**: Check for duplicate submissions within 5 minutes

### UI Error Handling
- **Font Loading**: Fallback fonts for unsupported fonts
- **Image Processing**: Error handling for corrupted images
- **Form Validation**: Real-time validation with user feedback

### Error Recovery
- **Storage Failure**: Graceful degradation with user notification
- **Network Issues**: Offline capability with local storage backup
- **Invalid Data**: Clear error messages and correction guidance

## Testing Strategy

### Unit Tests
- **RequestStorage Service**: Test all CRUD operations
- **Data Validation**: Test input validation and sanitization
- **Font Rendering**: Test font selection and application
- **Text Positioning**: Test coordinate calculations

### Integration Tests
- **End-to-End Workflow**: Test complete user journey
- **Component Integration**: Test data flow between components
- **Storage Integration**: Test request submission and retrieval

### User Acceptance Tests
- **Text Customization**: Verify font selection and sizing works correctly
- **Request Storage**: Verify requests are stored and retrievable
- **Preview Accuracy**: Verify preview matches final output
- **Form Validation**: Verify all validation rules work correctly

### Performance Tests
- **Memory Usage**: Monitor in-memory storage performance
- **Rendering Performance**: Test with large text and images
- **Font Loading**: Test font loading times and fallbacks

## Implementation Considerations

### Font Management
- Use web-safe fonts to ensure cross-browser compatibility
- Implement font loading detection to prevent FOUT (Flash of Unstyled Text)
- Provide font preview in selection dropdown
- Cache font metrics for consistent sizing

### Text Positioning
- Maintain current drag-and-drop functionality
- Ensure text stays within image boundaries
- Implement snap-to-grid for precise positioning
- Add keyboard shortcuts for fine-tuning

### Storage Limitations
- In-memory storage will be lost on page refresh/app restart
- Implement warning messages about data persistence
- Consider localStorage backup for development
- Plan for future database integration

### Browser Compatibility
- Ensure font rendering consistency across browsers
- Test drag-and-drop functionality on touch devices
- Implement responsive design for mobile customization
- Handle browser-specific font rendering differences

### Security Considerations
- Sanitize all user input to prevent XSS
- Validate image uploads for security
- Implement rate limiting for request submissions
- Ensure customer data is handled securely

## Future Enhancements

### Phase 2 Features
- Persistent database storage (SQLite/PostgreSQL)
- User authentication and accounts
- Request status tracking and notifications
- Advanced text effects (shadows, outlines, gradients)

### Phase 3 Features
- Real-time collaboration
- Template library
- Batch processing
- API integration for external systems