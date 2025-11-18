# Design Document

## Overview

This design outlines the migration from the current in-memory RequestStorage service to a PostgreSQL-backed implementation. The migration will maintain the existing API interface while adding data persistence, connection management, and proper database schema design. The solution uses the `pg` (node-postgres) library for database connectivity and implements connection pooling for performance.

## Architecture

### Database Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  RequestStorage (PostgreSQL Implementation)                 │
│  ├─ Same public API as current implementation               │
│  ├─ Connection pool management                              │
│  └─ SQL query execution                                     │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                            │
│  ├─ PostgreSQL Connection Pool                              │
│  ├─ Schema Management                                       │
│  └─ Query Execution                                         │
├─────────────────────────────────────────────────────────────┤
│                  PostgreSQL Database                        │
│  ├─ engraving_requests table                               │
│  ├─ request_metadata table                                 │
│  └─ Indexes for performance                                │
└─────────────────────────────────────────────────────────────┘
```

### Migration Strategy
1. **Parallel Implementation**: Create new PostgreSQL-backed RequestStorage alongside existing implementation
2. **Interface Preservation**: Maintain exact same public API to ensure zero breaking changes
3. **Gradual Rollout**: Replace in-memory implementation with PostgreSQL implementation
4. **Testing**: Ensure all existing tests pass with new implementation

## Components and Interfaces

### Database Schema

#### engraving_requests table
```sql
CREATE TABLE engraving_requests (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    original_image TEXT NOT NULL,
    composed_image TEXT,
    custom_text TEXT NOT NULL,
    text_position_x DECIMAL(10,6) NOT NULL,
    text_position_y DECIMAL(10,6) NOT NULL,
    font VARCHAR(100) NOT NULL,
    font_size INTEGER NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    comments TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engraving_requests_email ON engraving_requests(customer_email);
CREATE INDEX idx_engraving_requests_status ON engraving_requests(status);
CREATE INDEX idx_engraving_requests_timestamp ON engraving_requests(timestamp);
CREATE INDEX idx_engraving_requests_created_at ON engraving_requests(created_at);
```

#### request_metadata table (for statistics)
```sql
CREATE TABLE request_metadata (
    id SERIAL PRIMARY KEY,
    total_requests INTEGER NOT NULL DEFAULT 0,
    last_request_time TIMESTAMP WITH TIME ZONE,
    pending_count INTEGER NOT NULL DEFAULT 0,
    processing_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Initialize with default row
INSERT INTO request_metadata (id) VALUES (1);
```

### Database Connection Management

#### DatabaseConnection class
```javascript
class DatabaseConnection {
  static pool = null;
  
  static async initialize(config) {
    // Create connection pool
    // Handle connection errors
    // Test initial connection
  }
  
  static async query(text, params) {
    // Execute parameterized queries
    // Handle connection errors
    // Return results
  }
  
  static async transaction(callback) {
    // Execute multiple queries in transaction
    // Handle rollback on errors
  }
  
  static async close() {
    // Close connection pool gracefully
  }
}
```

### Updated RequestStorage Interface

The PostgreSQL implementation will maintain the exact same public interface:

```javascript
class RequestStorage {
  // Public API (unchanged)
  static async storeRequest(requestData)
  static async getAllRequests()
  static async getRequestById(id)
  static async getRequestStats()
  static async updateRequestStatus(id, status)
  static async cancelRequest(id)
  static async modifyRequest(id, updatedData)
  static async clearAll() // For testing only
  
  // New private methods for PostgreSQL
  static async #initializeDatabase()
  static async #checkForDuplicates(requestData)
  static async #updateMetadata(operation, oldStatus, newStatus)
}
```

## Data Models

### Request Data Mapping

**In-Memory Format → PostgreSQL Columns:**
- `id` → `id` (UUID)
- `timestamp` → `timestamp` (TIMESTAMP WITH TIME ZONE)
- `originalImage` → `original_image` (TEXT)
- `composedImage` → `composed_image` (TEXT, nullable)
- `customText` → `custom_text` (TEXT)
- `textPosition.x` → `text_position_x` (DECIMAL)
- `textPosition.y` → `text_position_y` (DECIMAL)
- `font` → `font` (VARCHAR)
- `fontSize` → `font_size` (INTEGER)
- `customerInfo.name` → `customer_name` (VARCHAR)
- `customerInfo.email` → `customer_email` (VARCHAR)
- `customerInfo.phone` → `customer_phone` (VARCHAR, nullable)
- `comments` → `comments` (TEXT, nullable)
- `status` → `status` (VARCHAR with CHECK constraint)

### Configuration Management

Database configuration will be handled through environment variables:
```javascript
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'suzengrave',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Error Handling

### Database Connection Errors
- **Connection Failure**: Graceful degradation with clear error messages
- **Query Timeout**: Retry logic with exponential backoff
- **Connection Pool Exhaustion**: Queue management and appropriate error responses

### Data Integrity Errors
- **Constraint Violations**: Convert PostgreSQL errors to user-friendly messages
- **Duplicate Key Errors**: Handle UUID collisions (extremely rare)
- **Invalid Data Types**: Validate data before database operations

### Migration Errors
- **Schema Creation Failures**: Detailed logging and rollback procedures
- **Permission Issues**: Clear error messages for database access problems

## Testing Strategy

### Unit Tests
- **Database Connection**: Mock PostgreSQL connections for isolated testing
- **Query Generation**: Test SQL query construction and parameterization
- **Data Transformation**: Test conversion between JavaScript objects and database rows
- **Error Handling**: Test all error scenarios with appropriate mocks

### Integration Tests
- **Database Operations**: Test against real PostgreSQL instance
- **Transaction Handling**: Test rollback scenarios
- **Connection Pool**: Test pool behavior under load
- **Schema Management**: Test table creation and migration

### Migration Testing
- **API Compatibility**: Ensure all existing tests pass with new implementation
- **Performance Testing**: Compare performance between in-memory and PostgreSQL
- **Data Consistency**: Verify data integrity during migration process

### Test Database Setup
```javascript
// Test configuration
const testDbConfig = {
  ...dbConfig,
  database: 'suzengrave_test',
};

// Test utilities
class TestDatabaseHelper {
  static async setupTestDatabase()
  static async cleanupTestDatabase()
  static async seedTestData()
}
```

## Performance Considerations

### Connection Pooling
- **Pool Size**: Configure based on expected concurrent users (default: 20)
- **Connection Reuse**: Minimize connection overhead
- **Idle Timeout**: Prevent resource leaks

### Query Optimization
- **Indexes**: Strategic indexing on frequently queried columns
- **Parameterized Queries**: Prevent SQL injection and improve query plan caching
- **Batch Operations**: Group multiple operations when possible

### Caching Strategy
- **Metadata Caching**: Cache request statistics to reduce database load
- **Connection Caching**: Reuse database connections efficiently

## Security Considerations

### SQL Injection Prevention
- **Parameterized Queries**: All user input through parameterized queries
- **Input Validation**: Validate all data before database operations
- **Escape Handling**: Proper escaping of special characters

### Database Security
- **Connection Security**: Use SSL connections in production
- **Credential Management**: Environment variable-based configuration
- **Least Privilege**: Database user with minimal required permissions

### Data Protection
- **Sensitive Data**: Consider encryption for customer information
- **Audit Trail**: Log all database operations for security monitoring