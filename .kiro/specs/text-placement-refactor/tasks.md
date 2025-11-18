# Implementation Plan

- [x] 1. Create unified positioning utility
  - Create a new utility module for consistent coordinate transformations
  - Implement percentage-based positioning that works across different image sizes
  - Write unit tests for position calculations and boundary constraints
  - _Requirements: 1.3, 2.1, 2.2, 2.3_

- [x] 2. Refactor ImageComposer service for consistency
  - Consolidate composeImage and generateTextPreview methods into a single unified method
  - Implement consistent font rendering logic that works the same for preview and final output
  - Remove duplicate positioning calculations and use the unified utility
  - Write tests to ensure preview and final output are identical
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Create canvas-based text overlay component
  - Build a new TextOverlay component that renders directly to canvas instead of DOM
  - Implement real-time text rendering with immediate visual feedback
  - Add mouse event handling for dragging and resizing operations
  - Write tests for canvas rendering and mouse interactions
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 5.1, 5.2_

- [x] 4. Simplify Step2Customize component state management
  - Remove complex debouncing logic and implement immediate updates
  - Consolidate text-related state into a simpler structure
  - Replace DOM-based text overlay with the new canvas-based component
  - Write tests for state management and component integration
  - _Requirements: 1.1, 1.2, 5.3, 5.4_

- [x] 5. Implement boundary constraints and validation
  - Add automatic text positioning constraints to keep text within image bounds
  - Implement smooth size limits (12px-72px) with visual feedback
  - Add input validation for text length and special characters
  - Write tests for all validation rules and boundary conditions
  - _Requirements: 3.3, 3.4, 5.3, 5.4_

- [x] 6. Add visual feedback and interaction improvements
  - Implement hover states and drag cursors for better user experience
  - Add smooth animations for text size changes and position updates
  - Create visual indicators for resize handles and drag areas
  - Write tests for user interaction feedback and accessibility
  - _Requirements: 5.1, 5.2_

- [x] 7. Update Step3Submit to use unified image generation
  - Modify Step3Submit to use the refactored ImageComposer service
  - Ensure final preview exactly matches the customization preview
  - Remove any duplicate image generation logic
  - Write integration tests for the complete workflow
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Create comprehensive test suite
  - Write unit tests for all new utility functions and components
  - Create integration tests for the complete text placement workflow
  - Add visual regression tests to ensure consistent rendering
  - Write performance tests for canvas operations and large images
  - _Requirements: All requirements_

- [x] 9. Performance optimization and cleanup
  - Optimize canvas rendering for smooth 60fps interactions
  - Implement memory management for image data and canvas contexts
  - Remove old code and unused dependencies from the refactor
  - Add performance monitoring and error handling
  - _Requirements: 1.2, 3.1, 5.2_