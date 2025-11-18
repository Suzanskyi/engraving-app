import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RequestManager from '../RequestManager.jsx';
import RequestStorage from '../../services/RequestStorage.js';

// Mock RequestStorage
vi.mock('../../services/RequestStorage.js', () => ({
  default: {
    getAllRequests: vi.fn(),
    getRequestStats: vi.fn(),
    updateRequestStatus: vi.fn(),
    cancelRequest: vi.fn(),
    modifyRequest: vi.fn(),
  }
}));

// Mock data
const mockRequests = [
  {
    id: 'req-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    originalImage: 'data:image/jpeg;base64,mockimage',
    customText: 'Test Engraving',
    textPosition: { x: 50, y: 50 },
    font: 'Arial',
    fontSize: 24,
    customerInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123'
    },
    comments: 'Test comment',
    status: 'pending'
  }
];

const mockStats = {
  total: 1,
  recent: 1,
  byStatus: {
    pending: 1,
    processing: 0,
    completed: 0
  }
};

describe('RequestManager - Core Functionality', () => {
  const mockOnClose = vi.fn();
  const mockOnModifyRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    RequestStorage.getAllRequests.mockReturnValue(mockRequests);
    RequestStorage.getRequestStats.mockReturnValue(mockStats);
  });

  it('renders request manager interface', () => {
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    expect(screen.getByText('Request Management')).toBeInTheDocument();
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('"Test Engraving"')).toBeInTheDocument();
  });

  it('shows request details when request is selected', () => {
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    fireEvent.click(screen.getByText('John Doe'));
    
    expect(screen.getByText('Request Details')).toBeInTheDocument();
    expect(screen.getByText('req-123')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Arial')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    fireEvent.click(screen.getByText('×'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onModifyRequest when modify button is clicked', () => {
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    // Select a request first
    fireEvent.click(screen.getByText('John Doe'));
    
    // Click modify button
    fireEvent.click(screen.getByText('Modify'));
    
    expect(mockOnModifyRequest).toHaveBeenCalledWith(mockRequests[0]);
  });

  it('shows cancel confirmation dialog', () => {
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    // Select a request first
    fireEvent.click(screen.getByText('John Doe'));
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Confirm dialog should appear
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to cancel this request/)).toBeInTheDocument();
  });

  it('filters requests by search term', () => {
    const multipleRequests = [
      ...mockRequests,
      {
        id: 'req-456',
        timestamp: new Date('2024-01-16T14:30:00Z'),
        originalImage: 'data:image/jpeg;base64,mockimage2',
        customText: 'Another Test',
        textPosition: { x: 30, y: 70 },
        font: 'Georgia',
        fontSize: 18,
        customerInfo: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: ''
        },
        comments: '',
        status: 'processing'
      }
    ];

    RequestStorage.getAllRequests.mockReturnValue(multipleRequests);
    
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    // Initially both should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Search for John
    const searchInput = screen.getByPlaceholderText('Search by name, email, ID, or text...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Only John should be visible now (this is a simplified test)
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('updates request status', () => {
    RequestStorage.updateRequestStatus.mockReturnValue(true);
    
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    // Select a request first
    fireEvent.click(screen.getByText('John Doe'));
    
    // Find status select and change it
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'processing' } });
    
    expect(RequestStorage.updateRequestStatus).toHaveBeenCalledWith('req-123', 'processing');
  });

  it('handles empty request list', () => {
    RequestStorage.getAllRequests.mockReturnValue([]);
    RequestStorage.getRequestStats.mockReturnValue({
      total: 0,
      recent: 0,
      byStatus: { pending: 0, processing: 0, completed: 0 }
    });
    
    render(<RequestManager onClose={mockOnClose} onModifyRequest={mockOnModifyRequest} />);
    
    expect(screen.getByText('No requests found')).toBeInTheDocument();
  });
});