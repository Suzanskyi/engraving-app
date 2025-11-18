/**
 * Express server for SuzEngrave application
 * Handles PostgreSQL operations and serves the React frontend
 */

// Load environment variables from .env file manually
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('Environment variables loaded from .env file');
  }
} catch (error) {
  console.warn('Could not load .env file:', error.message);
}

import express from 'express';
import cors from 'cors';
import { RequestStorage, DatabaseInitializer } from './services.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const isHealthy = await DatabaseInitializer.isHealthy();
    const stats = await DatabaseInitializer.getDatabaseStats();
    const connectionStats = DatabaseInitializer.getConnectionStats();
    
    res.json({
      healthy: isHealthy,
      database: { stats, connections: connectionStats },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request management endpoints
app.post('/api/requests', async (req, res) => {
  try {
    const request = await RequestStorage.storeRequest(req.body);
    res.status(201).json(request);
  } catch (error) {
    console.error('Error storing request:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const requests = await RequestStorage.getAllRequests();
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint must come before the :id route to avoid conflicts
app.get('/api/requests/stats', async (req, res) => {
  try {
    const stats = await RequestStorage.getRequestStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/requests/:id', async (req, res) => {
  try {
    const request = await RequestStorage.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const success = await RequestStorage.updateRequestStatus(req.params.id, status);
    if (!success) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const success = await RequestStorage.cancelRequest(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const request = await RequestStorage.modifyRequest(req.params.id, req.body);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error modifying request:', error);
    res.status(400).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await DatabaseInitializer.initialize();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  try {
    await DatabaseInitializer.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();