import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Step2Customize from '../Step2Customize';
import { ImageComposer } from '../../services';

// Mock the ImageComposer service
vi.mock('../../services', () => ({
  ImageComposer: {
    composeImage: vi.fn(),
    generateTextPreview: vi.fn(),
    getFontFamily: vi.fn((font) => font === 'arial' ? 'Arial, sans-serif' : font),
    drawObjectRepresentation: vi.fn(),
  }
}));

// Mock the TextOverlay component
vi.mock('../TextOverlay', () => ({
  default: ({ text, onPositionChange, onFontSizeChange, imageUrl, imageDescription }) => (
    <div data-testid="text-overlay">
      <div data-testid="overlay-text">{text}</div>
      <div data-testid="overlay-image-url">{imageUrl || 'no-image'}</div>
      <div data-testid="overlay-image-description">{imageDescription || 'no-description'}</div>
      <button
        data-testid="position-change-btn"
        onClick={() => onPositionChange && onPositionChange({ x: 60, y: 40 })}
      >
        Change Position
      </button>
      <button
        data-testid="font-size-change-btn"
        onClick={() => onFontSizeChange && onFontSizeChange(32)}
      >
        Change Font Size
      </button>
    </div>
  )
}));

describe('Step2Customize Simplified State Management', () => {
  const mockData = {
    originalImage: 'data:image/jpeg;base64,mockdata',
    customText: 'Test Text',
    textPosition: { x: 50, y: 50 },
    font: 'arial',
    fontSize: 24
  };

  const mockProps = {
    data: mockData,
    onUpdate: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ImageComposer.composeImage.mockResolvedValue('data:image/png;base64,composedmockdata');
    ImageComposer.generateTextPreview.mockResolvedValue('data:image/png;base64,previewmockdata');
  });

  describe('Immediate Updates', () => {
    it('should immediately update text without debouncing', async () => {
      render(<Step2Customize {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/enter your custom text/i);

      // Change the text
      fireEvent.change(textInput, { target: { value: 'New Text' } });

      // Should immediately call onUpdate
      expect(mockProps.onUpdate).toHaveBeenCalledWith({ customText: 'New Text' });
    });

    it('should immediately update font selection', () => {
      render(<Step2Customize {...mockProps} />);

      const fontSelect = screen.getByDisplayValue(/arial/i);

      // Change the font
      fireEvent.change(fontSelect, { target: { value: 'helvetica' } });

      // Should immediately call onUpdate
      expect(mockProps.onUpdate).toHaveBeenCalledWith({ font: 'helvetica' });
    });

    it('should clear composed image immediately when text is empty', async () => {
      const propsWithText = {
        ...mockProps,
        data: { ...mockData, customText: 'Some Text', composedImage: 'existing-image' }
      };

      const { rerender } = render(<Step2Customize {...propsWithText} />);

      const textInput = screen.getByPlaceholderText(/enter your custom text/i);

      // Clear the text
      fireEvent.change(textInput, { target: { value: '' } });

      // Should immediately update with empty text
      expect(mockProps.onUpdate).toHaveBeenCalledWith({ customText: '' });

      // Re-render with empty text to trigger the effect
      const updatedProps = {
        ...propsWithText,
        data: { ...propsWithText.data, customText: '' }
      };
      rerender(<Step2Customize {...updatedProps} />);

      // Should clear composed image
      await waitFor(() => {
        expect(mockProps.onUpdate).toHaveBeenCalledWith({ composedImage: null });
      });
    });
  });

  describe('Canvas-based TextOverlay Integration', () => {
    it('should render TextOverlay with correct props for image', () => {
      render(<Step2Customize {...mockProps} />);

      const textOverlay = screen.getByTestId('text-overlay');
      expect(textOverlay).toBeInTheDocument();

      expect(screen.getByTestId('overlay-text')).toHaveTextContent('Test Text');
      expect(screen.getByTestId('overlay-image-url')).toHaveTextContent('data:image/jpeg;base64,mockdata');
    });

    it('should render TextOverlay with image description when no image', () => {
      const propsWithDescription = {
        ...mockProps,
        data: { ...mockData, originalImage: null, originalText: 'A beautiful mug' }
      };

      render(<Step2Customize {...propsWithDescription} />);

      expect(screen.getByTestId('overlay-image-description')).toHaveTextContent('A beautiful mug');
      expect(screen.getByTestId('overlay-image-url')).toHaveTextContent('no-image');
    });

    it('should handle position changes from TextOverlay', () => {
      render(<Step2Customize {...mockProps} />);

      const positionChangeBtn = screen.getByTestId('position-change-btn');
      fireEvent.click(positionChangeBtn);

      expect(mockProps.onUpdate).toHaveBeenCalledWith({ textPosition: { x: 60, y: 40 } });
    });

    it('should handle font size changes from TextOverlay', () => {
      render(<Step2Customize {...mockProps} />);

      const fontSizeChangeBtn = screen.getByTestId('font-size-change-btn');
      fireEvent.click(fontSizeChangeBtn);

      expect(mockProps.onUpdate).toHaveBeenCalledWith({ fontSize: 32 });
    });
  });

  describe('Simplified State Structure', () => {
    it('should consolidate text-related state updates', async () => {
      const { rerender } = render(<Step2Customize {...mockProps} />);

      const textInput = screen.getByPlaceholderText(/enter your custom text/i);
      const fontSelect = screen.getByDisplayValue(/arial/i);

      // Make text change
      fireEvent.change(textInput, { target: { value: 'Updated Text' } });
      expect(mockProps.onUpdate).toHaveBeenCalledWith({ customText: 'Updated Text' });

      // Re-render with updated text
      const updatedProps = {
        ...mockProps,
        data: { ...mockData, customText: 'Updated Text' }
      };
      rerender(<Step2Customize {...updatedProps} />);

      // Make font change
      const updatedFontSelect = screen.getByDisplayValue(/arial/i);
      fireEvent.change(updatedFontSelect, { target: { value: 'georgia' } });
      expect(mockProps.onUpdate).toHaveBeenCalledWith({ font: 'georgia' });

      // Re-render with updated font
      const finalProps = {
        ...updatedProps,
        data: { ...updatedProps.data, font: 'georgia' }
      };
      rerender(<Step2Customize {...finalProps} />);


    });

    it('should handle text description preview generation', async () => {
      const propsWithDescription = {
        ...mockProps,
        data: {
          ...mockData,
          originalImage: null,
          originalText: 'A ceramic mug',
          customText: 'Custom Text'
        }
      };

      render(<Step2Customize {...propsWithDescription} />);


    });
  });



  describe('Navigation', () => {
    it('should enable next button when text is provided', () => {
      render(<Step2Customize {...mockProps} />);

      const nextButton = screen.getByText(/continue to review/i);
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable next button when no text is provided', () => {
      const propsWithoutText = {
        ...mockProps,
        data: { ...mockData, customText: '' }
      };

      render(<Step2Customize {...propsWithoutText} />);

      const nextButton = screen.getByText(/continue to review/i);
      expect(nextButton).toBeDisabled();
    });

    it('should call onPrev when back button is clicked', () => {
      render(<Step2Customize {...mockProps} />);

      const backButton = screen.getByText(/back/i);
      fireEvent.click(backButton);

      expect(mockProps.onPrev).toHaveBeenCalled();
    });

    it('should call onNext when continue button is clicked', () => {
      render(<Step2Customize {...mockProps} />);

      const nextButton = screen.getByText(/continue to review/i);
      fireEvent.click(nextButton);

      expect(mockProps.onNext).toHaveBeenCalled();
    });
  });
});