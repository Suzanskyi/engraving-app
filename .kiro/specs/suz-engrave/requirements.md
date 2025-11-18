# Requirements Document

## Introduction

SuzEngrave is an engraving request management system that allows users to upload objects, customize text placement with various fonts and sizes, and submit engraving requests. The system will store all submitted requests in an in-memory database for tracking and review purposes.

## Requirements

### Requirement 1

**User Story:** As a user, I want to store my engraving requests so that I can track what I've submitted and the system can maintain a record of all requests.

#### Acceptance Criteria

1. WHEN a user submits an engraving request THEN the system SHALL store the request data in an in-memory database
2. WHEN a request is stored THEN the system SHALL include all customization details (text, font, size, position)
3. WHEN a request is stored THEN the system SHALL assign a unique identifier to each request
4. WHEN a request is stored THEN the system SHALL include a timestamp of when the request was submitted

### Requirement 2

**User Story:** As a user, I want to place custom text on my uploaded object so that I can specify exactly what should be engraved.

#### Acceptance Criteria

1. WHEN a user is in the customization stage THEN the system SHALL provide a text input field for entering engraving text
2. WHEN a user enters text THEN the system SHALL display a preview of the text on the uploaded object
3. WHEN a user places text THEN the system SHALL allow positioning the text on the object surface
4. WHEN text is positioned THEN the system SHALL save the position coordinates for the engraving request

### Requirement 3

**User Story:** As a user, I want to adjust the size of my engraving text so that it fits appropriately on my object.

#### Acceptance Criteria

1. WHEN a user is customizing text THEN the system SHALL provide a size adjustment control
2. WHEN a user changes text size THEN the system SHALL update the preview in real-time
3. WHEN a user adjusts size THEN the system SHALL enforce minimum and maximum size limits
4. WHEN size is changed THEN the system SHALL maintain text positioning relative to the object

### Requirement 4

**User Story:** As a user, I want to choose from different fonts for my engraving text so that I can achieve the desired aesthetic for my project.

#### Acceptance Criteria

1. WHEN a user is customizing text THEN the system SHALL provide a font selection dropdown
2. WHEN a user selects a font THEN the system SHALL update the text preview immediately
3. WHEN fonts are displayed THEN the system SHALL include at least 5 different font options
4. WHEN a font is selected THEN the system SHALL apply the font to the engraving request data

### Requirement 5

**User Story:** As an administrator, I want to view all submitted engraving requests so that I can process and fulfill customer orders.

#### Acceptance Criteria

1. WHEN requests are stored THEN the system SHALL maintain a retrievable list of all requests
2. WHEN viewing requests THEN the system SHALL display request details including text, font, size, and timestamp
3. WHEN requests are accessed THEN the system SHALL provide the data in a structured format
4. IF the application restarts THEN the system SHALL acknowledge that in-memory data will be lost (temporary limitation)