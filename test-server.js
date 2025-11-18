/**
 * Test server to verify the setup works
 * This runs without requiring PostgreSQL to be installed
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Mock API Routes for testing
app.get('/api/health', (req, res) => {
  res.json({
    healthy: false,
    database: { 
      stats: null, 
      connections: null,
      error: 'PostgreSQL not connected - this is a test server'
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/requests', (req, res) => {
  res.status(503).json({ 
    error: 'Database not available - please set up PostgreSQL and use the real server' 
  });
});

app.get('/api/requests', (req, res) => {
  res.json([]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log('🧪 Test Server running on http://localhost:' + PORT);
  console.log('');
  console.log('⚠️  This is a TEST SERVER without PostgreSQL');
  console.log('📋 To use the full application with PostgreSQL:');
  console.log('   1. Install PostgreSQL');
  console.log('   2. Create databases (see SETUP_INSTRUCTIONS.md)');
  console.log('   3. Run: npm run server');
  console.log('');
  console.log('🌐 Open http://localhost:' + PORT + ' to see the React app');
});