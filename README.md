# SuzEngrave - Engraving Request Management System

A modern web application for managing custom engraving requests with PostgreSQL persistence, built with React and Vite.

## Features

- **Multi-step Request Process**: Guided workflow for uploading images, customizing text, and submitting requests
- **Image Composition**: Real-time preview of text overlay on uploaded images
- **Request Management**: View, track, and manage all engraving requests
- **PostgreSQL Integration**: Persistent data storage with full CRUD operations
- **Responsive Design**: Modern, mobile-friendly interface
- **Comprehensive Testing**: Unit and integration tests for reliability

## Prerequisites

Before running the application, ensure you have:

- **Node.js** 16 or higher
- **PostgreSQL** 12 or higher
- **npm** or **yarn** package manager

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd suzengrave
npm install
```

### 2. Database Setup (Docker)

**Prerequisites**: Make sure Docker is installed and running on your system.

The application uses PostgreSQL running in a Docker container - no need to install PostgreSQL locally!

### 3. Start Application

**Quick Start (Recommended):**
```bash
# This will start PostgreSQL in Docker and the application
./start.sh
```

**Manual Steps:**
```bash
# 1. Start PostgreSQL container
./docker-start.sh
# or
npm run docker:start

# 2. Build and start the application
npm run build
npm run server
```

**Development Mode:**
```bash
# 1. Start PostgreSQL container
./docker-start.sh

# 2. Start server with auto-reload
npm run dev:server

# 3. (Optional) Start React dev server in another terminal
npm run dev
```

### 4. Application URLs

Once running, you can access:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api/health
- **PostgreSQL**: localhost:5432 (user: postgres, password: suzengrave123)

### 5. Docker Management

```bash
# Start PostgreSQL container
./docker-start.sh

# Stop PostgreSQL container
./docker-stop.sh

# Reset PostgreSQL (deletes all data)
./docker-reset.sh

# View PostgreSQL logs
docker-compose logs -f postgres
```

## Database Configuration

The application uses PostgreSQL for persistent data storage. Key configuration options in `.env`:

```env
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=suzengrave        # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=              # Database password (set this!)
DB_POOL_SIZE=20           # Connection pool size
```

For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm test` - Run test suite
- `npm test:run` - Run tests once (CI mode)
- `npm test:ui` - Run tests with UI interface
- `npm run lint` - Run ESLint

## Architecture

### Frontend
- **React 19** with functional components and hooks
- **Vite** for fast development and building
- **Styled Components** for component styling
- **React Dropzone** for file uploads
- **React Image Crop** for image editing

### Backend Services
- **PostgreSQL** database with connection pooling
- **Request Storage Service** with full CRUD operations
- **Database Connection Management** with retry logic
- **Schema Management** with automatic migrations

### Key Components
- `RequestManager` - Main request management interface
- `Step1Upload` - Image upload and validation
- `Step2Customize` - Text overlay and positioning
- `Step3Submit` - Customer information and submission
- `ImageComposer` - Real-time image composition

## Database Schema

The application automatically creates these tables:

- **engraving_requests** - Stores all request data with customer info, images, and text
- **request_metadata** - Tracks statistics and request counts
- **schema_version** - Manages database schema versioning

## Testing

Comprehensive test suite covering:

```bash
# Run all tests
npm test

# Run specific test categories
npm test -- --grep "RequestStorage"     # Storage tests
npm test -- --grep "integration"       # Integration tests
npm test -- --grep "database"          # Database tests
```

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── __tests__/      # Component tests
│   └── *.jsx           # Component files
├── services/           # Business logic services
│   ├── __tests__/      # Service tests
│   ├── RequestStoragePostgreSQL.js  # Main storage service
│   ├── DatabaseConnection.js        # Connection management
│   └── AppInitializer.js           # Application startup
├── config/             # Configuration and schema
│   ├── database.js     # Database configuration
│   ├── schema.sql      # Database schema
│   └── schemaManager.js # Schema management
└── utils/              # Utility functions
    ├── validation.js   # Data validation
    └── uuid.js         # UUID generation
```

### Adding Features

1. **Database Changes**: Update `src/config/schema.sql` and increment schema version
2. **API Changes**: Modify `RequestStoragePostgreSQL.js` service methods
3. **UI Changes**: Update React components in `src/components/`
4. **Tests**: Add corresponding tests in `__tests__/` directories

## Production Deployment

### Environment Setup

```env
NODE_ENV=production
DB_SSL=true
DB_POOL_SIZE=50
# Set production database credentials
```

### Build and Deploy

```bash
# Build production bundle
npm run build

# The dist/ directory contains the built application
# Deploy dist/ to your web server
# Ensure PostgreSQL is configured and accessible
```

### Production Considerations

- Enable SSL for database connections
- Use connection pooling appropriate for your load
- Set up database backups and monitoring
- Configure proper error logging
- Use environment-specific database credentials

## Troubleshooting

### Database Connection Issues

1. **Connection Refused**: Ensure PostgreSQL is running
2. **Authentication Failed**: Check username/password in `.env`
3. **Database Not Found**: Create the database using SQL commands above
4. **Permission Denied**: Ensure database user has proper privileges

### Application Issues

1. **Startup Errors**: Check browser console and terminal for detailed errors
2. **Test Failures**: Ensure test database exists and is accessible
3. **Build Issues**: Clear `node_modules` and reinstall dependencies

For detailed troubleshooting, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.
