import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Step3Submit from '../Step3Submit';

// Mock the services module
vi.mock('../../services', () => ({
  RequestStorage: {
    storeRequest: vi.fn(),
    getAllRequests: vi.fn(),
    getRequestById: vi.fn(),
    getRequestStats: vi.fn(),
    updateRequestStatus: vi.fn(),
    cancelRequest: vi.fn(),
    modifyRequest: vi.fn(),
    clearAll: vi.fn()
  },
  ImageComposer: {
    composeImage: vi.fn()
  }
}));

import { RequestStorage, ImageComposer } from '../../services';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('Step3Submit Integration Tests', () => {
  const mockData = {
    originalImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    customText: 'Test Engraving',
    textPosition: { x: 50, y: 50 },
    font: 'Arial',
    fontSize: 24,
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    },
    comments: ''
  };

  const mockProps = {
    data: mockData,
    onUpdate: vi.fn(),
    onPrev: vi.fn(),
    onNavigateToRequests: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset RequestStorage mock to default successful behavior
    RequestStorage.storeRequest.mockResolvedValue({
      id: 'test-uuid-123',
      timestamp: new Date('2024-01-01T13:00:00.000Z'),
      originalImage: 'data:image/jpeg;base64,test',
      composedImage: null,
      customText: 'Test Engraving',
      textPosition: { x: 50, y: 50 },
      font: 'Arial',
      fontSize: 24,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: ''
      },
      comments: '',
      status: 'pending'
    });

    // Mock ImageComposer to return a composed image
    ImageComposer.composeImage.mockResolvedValue('data:image/png;base64,composed-image-data');
  });

  it('renders the form with all required fields', () => {
    render(<Step3Submit {...mockProps} />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional comments/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit order/i })).toBeInTheDocument();
  });

  it('displays order summary with correct data', async () => {
    render(<Step3Submit {...mockProps} />);
    
    // Wait for the ImageComposer to be called and preview to be generated
    await waitFor(() => {
      expect(ImageComposer.composeImage).toHaveBeenCalled();
    });
    
    expect(screen.getByText('Test Engraving')).toBeInTheDocument(); // In summary
    expect(screen.getByText('Arial')).toBeInTheDocument();
    expect(screen.getByText('24px')).toBeInTheDocument();
  });

  it('successfully submits and stores request', async () => {
    const mockStoredRequest = {
      id: 'test-uuid-123',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      originalImage: mockData.originalImage,
      customText: mockData.customText,
      textPosition: mockData.textPosition,
      font: mockData.font,
      fontSize: mockData.fontSize,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: ''
      },
      comments: '',
      status: 'pending'
    };

    RequestStorage.storeRequest.mockResolvedValue(mockStoredRequest);

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });

    // Wait for image generation to complete
    await waitFor(() => {
      expect(ImageComposer.composeImage).toHaveBeenCalled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(RequestStorage.storeRequest).toHaveBeenCalledWith({
        originalImage: mockData.originalImage,
        originalText: mockData.originalText || null,
        composedImage: 'data:image/png;base64,composed-image-data',
        customText: mockData.customText,
        textPosition: mockData.textPosition,
        font: mockData.font,
        fontSize: mockData.fontSize,
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: ''
        },
        comments: ''
      });
    });

    // Check success message and request ID display
    expect(screen.getByText(/order submitted successfully/i)).toBeInTheDocument();
    expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
    expect(screen.getByText(/your request id/i)).toBeInTheDocument();
  });

  it('handles storage errors gracefully', async () => {
    const errorMessage = 'Storage limit exceeded';
    RequestStorage.storeRequest.mockRejectedValue(new Error(errorMessage));

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    // Check that error message is displayed
    expect(await screen.findByText(/Storage limit exceeded/i)).toBeInTheDocument();

    // Should not show success message
    expect(screen.queryByText(/order submitted successfully/i)).not.toBeInTheDocument();
    // Should still show the form
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('disables submit button when required fields are empty', () => {
    render(<Step3Submit {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /submit order/i });
    expect(submitButton).toBeDisabled();

    // Fill in name only
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    expect(submitButton).toBeDisabled();

    // Fill in email as well
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    RequestStorage.storeRequest.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    // Check loading state
    expect(screen.getByText(/submitting.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submitting.../i })).toBeDisabled();
  });

  it('copies request ID to clipboard', async () => {
    const mockStoredRequest = {
      id: 'test-uuid-123',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      originalImage: mockData.originalImage,
      customText: mockData.customText,
      textPosition: mockData.textPosition,
      font: mockData.font,
      fontSize: mockData.fontSize,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: ''
      },
      comments: '',
      status: 'pending'
    };

    RequestStorage.storeRequest.mockResolvedValue(mockStoredRequest);

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields and submit
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(screen.getByText('test-uuid-123')).toBeInTheDocument();
    });

    // Click copy button
    fireEvent.click(screen.getByRole('button', { name: /copy request id/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-uuid-123');
  });

  it('displays request details in success message', async () => {
    const mockStoredRequest = {
      id: 'test-uuid-123',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      originalImage: mockData.originalImage,
      customText: mockData.customText,
      textPosition: mockData.textPosition,
      font: mockData.font,
      fontSize: mockData.fontSize,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      },
      comments: '',
      status: 'pending'
    };

    RequestStorage.storeRequest.mockResolvedValue(mockStoredRequest);

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields and submit
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '123-456-7890' }
    });
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  it('navigates to request manager when "View My Requests" is clicked', async () => {
    const mockStoredRequest = {
      id: 'test-uuid-123',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      originalImage: mockData.originalImage,
      customText: mockData.customText,
      textPosition: mockData.textPosition,
      font: mockData.font,
      fontSize: mockData.fontSize,
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: ''
      },
      comments: '',
      status: 'pending'
    };

    RequestStorage.storeRequest.mockResolvedValue(mockStoredRequest);

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields and submit
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(screen.getByText(/order submitted successfully/i)).toBeInTheDocument();
    });

    // Click "View My Requests" button
    fireEvent.click(screen.getByRole('button', { name: /view my requests/i }));

    expect(mockProps.onNavigateToRequests).toHaveBeenCalled();
  });

  it('updates form data and calls onUpdate', () => {
    render(<Step3Submit {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' }
    });

    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      customerInfo: { ...mockData.customerInfo, name: 'Jane Doe' },
      comments: mockData.comments
    });
  });

  it('validates request data before storage', async () => {
    const validationError = 'Invalid email format';
    RequestStorage.storeRequest.mockRejectedValue(new Error(`Validation failed: ${validationError}`));

    render(<Step3Submit {...mockProps} />);
    
    // Fill in required fields with invalid data
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' }
    });

    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

    await waitFor(() => {
      expect(screen.getByText(/validation failed: invalid email format/i)).toBeInTheDocument();
    });
  });

  describe('Unified Image Generation Integration', () => {
    it('generates final preview using ImageComposer with correct parameters', async () => {
      const testData = {
        ...mockData,
        originalImage: 'data:image/jpeg;base64,test-image',
        originalText: 'Test Object',
        customText: 'Custom Engraving',
        textPosition: { x: 30, y: 70 },
        font: 'Helvetica',
        fontSize: 32
      };

      render(<Step3Submit {...{ ...mockProps, data: testData }} />);

      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledWith({
          imageUrl: 'data:image/jpeg;base64,test-image',
          description: 'Test Object',
          text: 'Custom Engraving',
          position: { x: 30, y: 70 },
          font: 'Helvetica',
          fontSize: 32,
          color: '#333',
          maxWidth: 800,
          isPreview: false
        });
      });
    });

    it('uses preview mode when no original image is provided', async () => {
      const testData = {
        ...mockData,
        originalImage: null,
        originalText: 'Test Object Description',
        customText: 'Preview Text',
        textPosition: { x: 50, y: 50 },
        font: 'Arial',
        fontSize: 24
      };

      render(<Step3Submit {...{ ...mockProps, data: testData }} />);

      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledWith({
          imageUrl: null,
          description: 'Test Object Description',
          text: 'Preview Text',
          position: { x: 50, y: 50 },
          font: 'Arial',
          fontSize: 24,
          color: '#333',
          maxWidth: 800,
          isPreview: true
        });
      });
    });

    it('handles ImageComposer errors gracefully and falls back to existing composed image', async () => {
      const testData = {
        ...mockData,
        composedImage: 'data:image/png;base64,fallback-image'
      };

      ImageComposer.composeImage.mockRejectedValue(new Error('Canvas error'));

      render(<Step3Submit {...{ ...mockProps, data: testData }} />);

      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalled();
      });

      // Should show the fallback image
      expect(screen.getByAltText('Final composed preview')).toHaveAttribute('src', 'data:image/png;base64,fallback-image');
    });

    it('shows generating indicator while ImageComposer is processing', async () => {
      // Make ImageComposer take some time to resolve
      ImageComposer.composeImage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data:image/png;base64,generated'), 100))
      );

      render(<Step3Submit {...mockProps} />);

      // Should show generating indicator
      expect(screen.getByText('(Generating...)')).toBeInTheDocument();

      // Wait for generation to complete
      await waitFor(() => {
        expect(screen.queryByText('(Generating...)')).not.toBeInTheDocument();
      });
    });

    it('stores the generated composed image in the request data', async () => {
      const generatedImage = 'data:image/png;base64,unified-generated-image';
      ImageComposer.composeImage.mockResolvedValue(generatedImage);

      render(<Step3Submit {...mockProps} />);

      // Wait for image generation
      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalled();
      });

      // Fill in required fields and submit
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

      await waitFor(() => {
        expect(RequestStorage.storeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            composedImage: generatedImage
          })
        );
      });
    });

    it('regenerates preview when data changes', async () => {
      const { rerender } = render(<Step3Submit {...mockProps} />);

      // Wait for initial generation
      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledTimes(1);
      });

      // Update the data
      const updatedData = {
        ...mockData,
        customText: 'Updated Text',
        fontSize: 36
      };

      rerender(<Step3Submit {...{ ...mockProps, data: updatedData }} />);

      // Should trigger another generation
      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledTimes(2);
      });

      // Verify the new parameters
      expect(ImageComposer.composeImage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          text: 'Updated Text',
          fontSize: 36
        })
      );
    });
  });

  describe('Complete Workflow Integration', () => {
    it('completes the entire workflow from preview generation to storage', async () => {
      const workflowData = {
        originalImage: 'data:image/jpeg;base64,workflow-test',
        originalText: 'Workflow Object',
        customText: 'Workflow Engraving',
        textPosition: { x: 25, y: 75 },
        font: 'Georgia',
        fontSize: 28,
        customerInfo: { name: '', email: '', phone: '' },
        comments: ''
      };

      const generatedImage = 'data:image/png;base64,workflow-generated';
      ImageComposer.composeImage.mockResolvedValue(generatedImage);

      render(<Step3Submit {...{ ...mockProps, data: workflowData }} />);

      // Step 1: Verify preview generation
      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledWith({
          imageUrl: 'data:image/jpeg;base64,workflow-test',
          description: 'Workflow Object',
          text: 'Workflow Engraving',
          position: { x: 25, y: 75 },
          font: 'Georgia',
          fontSize: 28,
          color: '#333',
          maxWidth: 800,
          isPreview: false
        });
      });

      // Step 2: Verify preview is displayed
      expect(screen.getByAltText('Final composed preview')).toHaveAttribute('src', generatedImage);

      // Step 3: Fill form and submit
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Workflow User' }
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'workflow@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: '555-0123' }
      });
      fireEvent.change(screen.getByLabelText(/additional comments/i), {
        target: { value: 'Workflow test comment' }
      });

      fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

      // Step 4: Verify complete request data is stored
      await waitFor(() => {
        expect(RequestStorage.storeRequest).toHaveBeenCalledWith({
          originalImage: 'data:image/jpeg;base64,workflow-test',
          originalText: 'Workflow Object',
          composedImage: generatedImage,
          customText: 'Workflow Engraving',
          textPosition: { x: 25, y: 75 },
          font: 'Georgia',
          fontSize: 28,
          customerInfo: {
            name: 'Workflow User',
            email: 'workflow@example.com',
            phone: '555-0123'
          },
          comments: 'Workflow test comment'
        });
      });

      // Step 5: Verify success state
      expect(screen.getByText(/order submitted successfully/i)).toBeInTheDocument();
    });

    it('handles workflow with text-only preview (no original image)', async () => {
      const textOnlyData = {
        originalImage: null,
        originalText: 'Text Only Object',
        customText: 'Text Only Engraving',
        textPosition: { x: 50, y: 50 },
        font: 'Arial',
        fontSize: 24,
        customerInfo: { name: '', email: '', phone: '' },
        comments: ''
      };

      const previewImage = 'data:image/png;base64,text-only-preview';
      ImageComposer.composeImage.mockResolvedValue(previewImage);

      render(<Step3Submit {...{ ...mockProps, data: textOnlyData }} />);

      // Verify preview mode is used
      await waitFor(() => {
        expect(ImageComposer.composeImage).toHaveBeenCalledWith(
          expect.objectContaining({
            imageUrl: null,
            isPreview: true
          })
        );
      });

      // Complete the workflow
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Text User' }
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'text@example.com' }
      });
      fireEvent.click(screen.getByRole('button', { name: /submit order/i }));

      // Verify storage includes generated preview
      await waitFor(() => {
        expect(RequestStorage.storeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            composedImage: previewImage,
            originalImage: null
          })
        );
      });
    });
  });
});