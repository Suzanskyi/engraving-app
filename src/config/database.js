/**
 * Database configuration module with environment variable support
 * Provides configuration for PostgreSQL connection in development and testing environments
 */

/**
 * Get base database configuration from environment variables
 * @returns {Object} Base database configuration
 */
function getBaseConfig() {
  return {
    // Connection settings
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'suzengrave',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_SIZE) || 20, // Maximum number of connections in pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle connections after 30s
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Timeout for new connections
    
    // SSL configuration (disabled for local development)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

// Export getter functions for configurations
export const dbConfig = getBaseConfig;

export function testDbConfig() {
  const base = getBaseConfig();
  return {
    ...base,
    database: process.env.DB_TEST_NAME || 'suzengrave_test',
    // Use smaller pool for testing
    max: 5,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 1000,
  };
}

export function prodDbConfig() {
  const base = getBaseConfig();
  return {
    ...base,
    // Enable SSL for production
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    // Larger pool for production
    max: parseInt(process.env.DB_POOL_SIZE) || 50,
  };
}

/**
 * Get database configuration based on environment
 * @returns {Object} Database configuration object
 */
export function getDatabaseConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      return testDbConfig();
    case 'production':
      return prodDbConfig();
    default:
      return dbConfig();
  }
}

/**
 * Validate database configuration
 * @param {Object} config - Database configuration object
 * @throws {Error} If configuration is invalid
 */
export function validateDatabaseConfig(config) {
  const required = ['host', 'port', 'database', 'user'];
  
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Database configuration missing required field: ${field}`);
    }
  }
  
  if (typeof config.port !== 'number' || config.port < 1 || config.port > 65535) {
    throw new Error('Database port must be a valid number between 1 and 65535');
  }
  
  if (typeof config.max !== 'number' || config.max < 1) {
    throw new Error('Database pool size (max) must be a positive number');
  }
}

// For backward compatibility, export the functions
export { getBaseConfig };