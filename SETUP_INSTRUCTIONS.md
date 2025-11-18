# Complete Setup Instructions for PostgreSQL Integration (Docker)

## Prerequisites

You only need Docker installed on your system:

### macOS
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### Windows
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the installer and follow the setup wizard
3. Make sure Docker Desktop is running

## Database Setup (Automatic)

The PostgreSQL database runs in a Docker container and is automatically configured:

- **Database**: suzengrave
- **Test Database**: suzengrave_test  
- **User**: postgres
- **Password**: suzengrave123
- **Port**: 5432

No manual database creation needed - everything is handled automatically!

## Running the Application

### Option 1: Use the startup script (Recommended)
```bash
./start.sh
```

### Option 2: Manual startup
```bash
# Build the React frontend
npm run build

# Start the Node.js server with PostgreSQL
npm run server
```

### Option 3: Development mode
```bash
# Terminal 1: Start the backend server
npm run dev:server

# Terminal 2: Start React dev server (optional, for frontend development)
npm run dev
```

## Application URLs

Once running, you can access:
- **Main Application**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **API Endpoints**: http://localhost:3001/api/requests

## Architecture

The application now works as follows:

1. **Frontend (React)**: Runs in the browser and makes HTTP requests to the backend
2. **Backend (Node.js + Express)**: Handles PostgreSQL operations and serves the React app
3. **Database (PostgreSQL)**: Stores all engraving requests persistently

## API Endpoints

- `GET /api/health` - Check server and database health
- `POST /api/requests` - Create new engraving request
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get specific request
- `PUT /api/requests/:id/status` - Update request status
- `PUT /api/requests/:id` - Modify request
- `DELETE /api/requests/:id` - Cancel/delete request

## Testing

```bash
# Run all tests (uses mocked database)
npm test

# Run specific test suites
npm test -- --grep "PostgreSQL"
npm test -- --grep "RequestStorage"
```

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running: `brew services list | grep postgresql`
2. Check if databases exist: `psql -U postgres -l`
3. Verify credentials in `.env` file
4. Check server logs for detailed error messages

### Port Conflicts
If port 3001 is in use, set a different port:
```bash
PORT=3002 npm run server
```

### Build Issues
If the build fails, try:
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. Install PostgreSQL on your system
2. Create the databases as shown above
3. Set up your `.env` file with database credentials
4. Run `./start.sh` to start the application
5. Open http://localhost:3001 in your browser

The application will automatically:
- Connect to PostgreSQL
- Create all required database tables
- Initialize the schema
- Start serving the React frontend
- Provide a REST API for all operations

All your engraving requests will be stored persistently in PostgreSQL!