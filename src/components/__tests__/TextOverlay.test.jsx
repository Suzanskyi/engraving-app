import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TextOverlay from '../TextOverlay.jsx';

// Mock the ImageComposer service
vi.mock('../../services', () => ({
  ImageComposer: {
    drawObjectRepresentation: vi.fn(),
  }
}));

// Mock the positioning utilities
vi.mock('../../utils/positioning.js', () => ({
  constrainPosition: vi.fn((position) => ({
    constrainedPosition: position,
    feedback: { wasConstrained: false, hitBoundaries: { left: false, right: false, top: false, bottom: false } }
  })),
  isPositionWithinBounds: vi.fn(() => true)
}));

// Mock the validation utilities
vi.mock('../../utils/validation.js', () => ({
  validateTextContent: vi.fn((text) => ({
    isValid: true,
    errors: [],
    sanitizedText: text
  })),
  constrainFontSize: vi.fn((fontSize) => Math.max(12, Math.min(72, fontSize))),
  normalizePosition: vi.fn((pos) => Math.max(0, Math.min(100, pos)))
}));

describe('TextOverlay Component', () => {
  let mockOnPositionChange;
  let mockOnFontSizeChange;

  beforeEach(() => {
    mockOnPositionChange = vi.fn();
    mockOnFontSizeChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render canvas element with correct dimensions', () => {
      const { container } = render(
        <TextOverlay
          text="Test Text"
          position={{ x: 50, y: 50 }}
          width={600}
          height={400}
          onPositionChange={mockOnPositionChange}
          onFontSizeChange={mockOnFontSizeChange}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should render with image URL', () => {
      const { container } = render(
        <TextOverlay
          text="Test Text"
          position={{ x: 50, y: 50 }}
          imageUrl="data:image/jpeg;base64,mockdata"
          width={600}
          height={400}
          onPositionChange={mockOnPositionChange}
          onFontSizeChange={mockOnFontSizeChange}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render with image description when no image URL', () => {
      const { container } = render(
        <TextOverlay
          text="Test Text"
          position={{ x: 50, y: 50 }}
          imageDescription="A coffee mug"
          width={600}
          height={400}
          onPositionChange={mockOnPositionChange}
          onFontSizeChange={mockOnFontSizeChange}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should accept all required props', () => {
      const props = {
        text: "Test Text",
        position: { x: 50, y: 50 },
        font: "arial",
        fontSize: 24,
        color: "#333",
        width: 600,
        height: 400,
        onPositionChange: mockOnPositionChange,
        onFontSizeChange: mockOnFontSizeChange
      };

      const { container } = render(<TextOverlay {...props} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle optional props', () => {
      const { container } = render(
        <TextOverlay
          text="Test Text"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          onFontSizeChange={mockOnFontSizeChange}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });
});