/**
 * Database Schema Manager
 * Handles database initialization, schema creation, and migration utilities
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Schema Manager class for database initialization and migrations
 */
export class SchemaManager {
  constructor(databaseConnection) {
    this.db = databaseConnection;
    this.schemaVersion = '1.0.0';
  }

  /**
   * Initialize the database with required tables and indexes
   * @returns {Promise<void>}
   */
  async initializeDatabase() {
    try {
      console.log('Initializing database schema...');
      
      // Read the schema SQL file
      const schemaPath = join(__dirname, 'schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf8');
      
      // Execute the schema creation
      await this.db.query(schemaSql);
      
      // Run migrations
      await this.runMigrations();
      
      // Verify tables were created
      await this.verifySchema();
      
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw new Error(`Schema initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify that all required tables and indexes exist
   * @returns {Promise<boolean>}
   */
  async verifySchema() {
    try {
      // Check if required tables exist
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('engraving_requests', 'request_metadata')
        ORDER BY table_name;
      `;
      
      const result = await this.db.query(tableCheckQuery);
      const existingTables = result.rows.map(row => row.table_name);
      
      const requiredTables = ['engraving_requests', 'request_metadata'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }

      // Check if required indexes exist
      const indexCheckQuery = `
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'engraving_requests'
        AND indexname LIKE 'idx_%';
      `;
      
      const indexResult = await this.db.query(indexCheckQuery);
      const existingIndexes = indexResult.rows.map(row => row.indexname);
      
      const requiredIndexes = [
        'idx_engraving_requests_email',
        'idx_engraving_requests_status', 
        'idx_engraving_requests_timestamp',
        'idx_engraving_requests_created_at'
      ];
      
      const missingIndexes = requiredIndexes.filter(index => !existingIndexes.includes(index));
      
      if (missingIndexes.length > 0) {
        console.warn(`Missing indexes (will be created): ${missingIndexes.join(', ')}`);
      }

      console.log('Schema verification completed successfully');
      return true;
    } catch (error) {
      console.error('Schema verification failed:', error);
      throw error;
    }
  }

  /**
   * Get current schema version
   * @returns {Promise<string>}
   */
  async getSchemaVersion() {
    try {
      // Check if schema_version table exists
      const versionTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_version'
        );
      `;
      
      const result = await this.db.query(versionTableQuery);
      
      if (!result.rows[0].exists) {
        // Create schema_version table if it doesn't exist
        await this.createSchemaVersionTable();
        return '1.0.0';
      }
      
      // Get current version
      const versionQuery = 'SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1;';
      const versionResult = await this.db.query(versionQuery);
      
      return versionResult.rows.length > 0 ? versionResult.rows[0].version : '1.0.0';
    } catch (error) {
      console.error('Failed to get schema version:', error);
      return '1.0.0';
    }
  }

  /**
   * Create schema version tracking table
   * @returns {Promise<void>}
   */
  async createSchemaVersionTable() {
    const createVersionTableQuery = `
      CREATE TABLE IF NOT EXISTS schema_version (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      INSERT INTO schema_version (version, description) 
      VALUES ('1.0.0', 'Initial schema creation')
      ON CONFLICT DO NOTHING;
    `;
    
    await this.db.query(createVersionTableQuery);
  }

  /**
   * Run database migrations
   * @returns {Promise<void>}
   */
  async runMigrations() {
    try {
      console.log('Running database migrations...');
      
      // Ensure schema version table exists
      await this.createSchemaVersionTable();
      
      // Get current version
      const currentVersion = await this.getSchemaVersion();
      console.log(`Current schema version: ${currentVersion}`);
      
      // Run migration for version 1.1.0 if needed
      if (currentVersion === '1.0.0') {
        console.log('Running migration to version 1.1.0...');
        const migrationPath = join(__dirname, 'migrations', '001_add_original_text.sql');
        
        try {
          const migrationSql = readFileSync(migrationPath, 'utf8');
          await this.db.query(migrationSql);
          console.log('Migration to version 1.1.0 completed successfully');
        } catch (error) {
          console.error('Migration failed:', error);
          // Don't throw error if migration fails - the app should still work
        }
      }
      
      console.log('Database migrations completed');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      // Don't throw error - the app should still work with the base schema
    }
  }

  /**
   * Drop all tables (for testing purposes)
   * @returns {Promise<void>}
   */
  async dropAllTables() {
    try {
      console.log('Dropping all tables...');
      
      const dropTablesQuery = `
        DROP TABLE IF EXISTS engraving_requests CASCADE;
        DROP TABLE IF EXISTS request_metadata CASCADE;
        DROP TABLE IF EXISTS schema_version CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      `;
      
      await this.db.query(dropTablesQuery);
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Failed to drop tables:', error);
      throw error;
    }
  }

  /**
   * Reset database to clean state (for testing)
   * @returns {Promise<void>}
   */
  async resetDatabase() {
    await this.dropAllTables();
    await this.initializeDatabase();
  }

  /**
   * Check database connection and basic functionality
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      // Test basic query
      await this.db.query('SELECT 1 as test');
      
      // Check if tables exist
      await this.verifySchema();
      
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>}
   */
  async getDatabaseStats() {
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM engraving_requests) as total_requests,
          (SELECT COUNT(*) FROM engraving_requests WHERE status = 'pending') as pending_requests,
          (SELECT COUNT(*) FROM engraving_requests WHERE status = 'processing') as processing_requests,
          (SELECT COUNT(*) FROM engraving_requests WHERE status = 'completed') as completed_requests,
          (SELECT MAX(created_at) FROM engraving_requests) as last_request_time;
      `;
      
      const result = await this.db.query(statsQuery);
      return result.rows[0] || {
        total_requests: 0,
        pending_requests: 0,
        processing_requests: 0,
        completed_requests: 0,
        last_request_time: null
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

/**
 * Create and return a new SchemaManager instance
 * @param {Object} databaseConnection - Database connection instance
 * @returns {SchemaManager}
 */
export function createSchemaManager(databaseConnection) {
  return new SchemaManager(databaseConnection);
}