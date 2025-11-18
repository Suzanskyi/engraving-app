#!/usr/bin/env node

/**
 * Simple database connection test script
 * Tests if we can connect to PostgreSQL and query the schema
 */

import DatabaseConnection from './src/services/DatabaseConnection.js';
import { createSchemaManager } from './src/config/schemaManager.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Initialize database connection
    await DatabaseConnection.initialize();
    console.log('✅ Database connection established');
    
    // Create schema manager
    const schemaManager = createSchemaManager(DatabaseConnection);
    
    // Test basic query
    const result = await DatabaseConnection.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', result.rows[0].current_time);
    
    // Check if tables exist
    const tablesResult = await DatabaseConnection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Initialize schema if needed
    console.log('🔧 Initializing schema...');
    await schemaManager.initializeDatabase();
    console.log('✅ Schema initialization completed');
    
    // Test request storage
    console.log('🧪 Testing request storage...');
    const { default: RequestStorage } = await import('./src/services/RequestStoragePostgreSQL.js');
    
    const stats = await RequestStorage.getRequestStats();
    console.log('📊 Current stats:', stats);
    
    const requests = await RequestStorage.getAllRequests();
    console.log(`📝 Found ${requests.length} existing requests`);
    
    // Close connection
    await DatabaseConnection.close();
    console.log('✅ Database connection closed');
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testDatabase();