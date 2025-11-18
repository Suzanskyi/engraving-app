import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create mock RequestStorage that can be used across tests
const mockRequestStorage = {
  storeRequest: vi.fn().mockResolvedValue({
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
  }),
  getAllRequests: vi.fn().mockResolvedValue([]),
  getRequestById: vi.fn().mockResolvedValue(null),
  getRequestStats: vi.fn().mockResolvedValue({
    total: 0,
    recent: 0,
    byStatus: { pending: 0, processing: 0, completed: 0 },
    lastRequestTime: null
  }),
  updateRequestStatus: vi.fn().mockResolvedValue(true),
  cancelRequest: vi.fn().mockResolvedValue(true),
  modifyRequest: vi.fn().mockResolvedValue(null),
  clearAll: vi.fn().mockResolvedValue(undefined)
};

// Mock the RequestStorage service for component tests
vi.mock('../services/RequestStoragePostgreSQL.js', () => {
  return {
    default: mockRequestStorage
  };
});

// Mock the services index file
vi.mock('../services/index.js', () => {
  return {
    RequestStorage: mockRequestStorage,
    ImageComposer: {
      composeImage: vi.fn().mockReturnValue('data:image/jpeg;base64,composed'),
    },
    DatabaseConnection: {
      initialize: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isHealthy: vi.fn().mockResolvedValue(true),
      getPoolStats: vi.fn().mockReturnValue({
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0
      })
    },
    DatabaseInitializer: {
      initialize: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      isHealthy: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockResolvedValue({
        initialized: true,
        healthy: true,
        database: { stats: null, connections: null },
        timestamp: new Date().toISOString()
      })
    }
  };
});

// Mock the DatabaseConnection service
vi.mock('../services/DatabaseConnection.js', () => {
  return {
    default: {
      initialize: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isHealthy: vi.fn().mockResolvedValue(true),
      getPoolStats: vi.fn().mockReturnValue({
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0
      })
    }
  };
});

// Mock the AppInitializer service
vi.mock('../services/AppInitializer.js', () => {
  return {
    default: {
      initialize: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      isHealthy: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockResolvedValue({
        initialized: true,
        healthy: true,
        database: {
          stats: null,
          connections: null
        },
        timestamp: new Date().toISOString()
      })
    }
  };
});