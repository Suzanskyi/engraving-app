# Requirements Document

## Introduction

This specification focuses on refactoring the text placement feature in the SuzEngrave application to make it simpler, more reliable, and provide better visual feedback. The current implementation has complexity issues with text positioning, preview generation, and user interaction that need to be streamlined for a better user experience.

## Requirements

### Requirement 1

**User Story:** As a user, I want to easily place text on my image with immediate visual feedback so that I can see exactly how my text will appear on the final product.

#### Acceptance Criteria

1. WHEN a user types text in the input field THEN the system SHALL display the text overlay on the image immediately
2. WHEN a user drags the text overlay THEN the system SHALL update the position in real-time without lag
3. WHEN text is positioned THEN the system SHALL show the exact position that will be used in the final output
4. WHEN no image is uploaded THEN the system SHALL show a clear placeholder with text positioning capabilities

### Requirement 2

**User Story:** As a user, I want the text positioning to work consistently across different image sizes and aspect ratios so that my design looks correct regardless of the image I upload.

#### Acceptance Criteria

1. WHEN an image is uploaded THEN the system SHALL normalize text positioning to work with any image dimensions
2. WHEN text is positioned on a small image THEN the system SHALL maintain the same relative position on larger images
3. WHEN the preview is generated THEN the system SHALL use the exact same positioning logic as the interactive overlay
4. WHEN switching between different images THEN the system SHALL preserve text position as a percentage of image dimensions

### Requirement 3

**User Story:** As a user, I want to resize text easily and see the changes immediately so that I can find the perfect size for my design.

#### Acceptance Criteria

1. WHEN a user drags the resize handle THEN the system SHALL update the text size smoothly in real-time
2. WHEN text size changes THEN the system SHALL maintain the text center position during resize
3. WHEN text reaches minimum size (12px) THEN the system SHALL prevent further size reduction
4. WHEN text reaches maximum size (72px) THEN the system SHALL prevent further size increase

### Requirement 4

**User Story:** As a user, I want the final preview to exactly match what I see during customization so that there are no surprises in the final output.

#### Acceptance Criteria

1. WHEN the final preview is generated THEN the system SHALL use identical positioning, sizing, and styling as the interactive preview
2. WHEN text has a background in the preview THEN the system SHALL apply the same background in the final output
3. WHEN fonts are applied THEN the system SHALL ensure consistent font rendering between preview and final output
4. WHEN text positioning is calculated THEN the system SHALL use the same coordinate system for both preview and final generation

### Requirement 5

**User Story:** As a user, I want the text placement interface to be intuitive and responsive so that I can quickly achieve my desired design without technical difficulties.

#### Acceptance Criteria

1. WHEN a user hovers over the text overlay THEN the system SHALL show visual indicators that it can be moved and resized
2. WHEN a user starts dragging THEN the system SHALL provide clear visual feedback about the drag operation
3. WHEN text is being positioned THEN the system SHALL prevent text from being placed outside the image boundaries
4. WHEN the user releases the mouse THEN the system SHALL snap the text to a valid position if it was dragged outside bounds