# Database Setup Guide

This guide explains how to set up and configure PostgreSQL for the SuzEngrave application.

## Prerequisites

- PostgreSQL 12 or higher installed on your system
- Node.js 16 or higher
- npm or yarn package manager

## PostgreSQL Installation

### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create a database user (optional, you can use the default postgres user)
createuser -s suzengrave
```

### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database user
sudo -u postgres createuser -s suzengrave
```

### Windows
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the postgres user
4. Ensure PostgreSQL service is running

## Database Configuration

### 1. Create Database

Connect to PostgreSQL and create the application database:

```bash
# Connect to PostgreSQL (replace 'postgres' with your username if different)
psql -U postgres

# Create the database
CREATE DATABASE suzengrave;

# Create test database (for running tests)
CREATE DATABASE suzengrave_test;

# Exit psql
\q
```

### 2. Environment Configuration

Create a `.env` file in the project root with your database configuration:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your database settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=suzengrave
DB_USER=postgres
DB_PASSWORD=your_password_here

# Test Database Configuration
DB_TEST_NAME=suzengrave_test

# Connection Pool Settings (optional)
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# SSL Configuration (set to true for production)
DB_SSL=false
```

### 3. Database Schema

The application will automatically create the required tables and indexes when it starts. The schema includes:

- `engraving_requests` - Stores all engraving request data
- `request_metadata` - Tracks request statistics and metadata
- `schema_version` - Tracks database schema versions

## Verification

### 1. Test Database Connection

Start the application to verify the database connection:

```bash
npm run dev
```

If successful, you should see:
```
Starting database initialization...
Database connection pool initialized successfully
Database schema initialized successfully
Schema verification completed successfully
Database initialization completed successfully
Application started successfully
```

### 2. Manual Database Verification

You can manually verify the database setup:

```bash
# Connect to your database
psql -U postgres -d suzengrave

# List tables
\dt

# Check table structure
\d engraving_requests
\d request_metadata

# Exit
\q
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
**Error:** `Database connection refused: Please check if PostgreSQL is running`

**Solutions:**
- Ensure PostgreSQL service is running
- Check if the port (default 5432) is correct
- Verify firewall settings

#### 2. Authentication Failed
**Error:** `password authentication failed for user "postgres"`

**Solutions:**
- Verify the password in your `.env` file
- Reset PostgreSQL password if needed
- Check PostgreSQL authentication configuration (`pg_hba.conf`)

#### 3. Database Does Not Exist
**Error:** `database "suzengrave" does not exist`

**Solutions:**
- Create the database manually using the commands above
- Verify the database name in your `.env` file

#### 4. Permission Denied
**Error:** `permission denied for relation engraving_requests`

**Solutions:**
- Ensure your database user has sufficient privileges
- Grant necessary permissions or use a superuser account

### Reset Database

If you need to reset the database (this will delete all data):

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop and recreate the database
DROP DATABASE IF EXISTS suzengrave;
CREATE DATABASE suzengrave;

# Do the same for test database
DROP DATABASE IF EXISTS suzengrave_test;
CREATE DATABASE suzengrave_test;

# Exit
\q
```

Then restart the application to recreate the schema.

## Production Considerations

### Security
- Use a dedicated database user with minimal required privileges
- Enable SSL connections (`DB_SSL=true`)
- Use strong passwords
- Restrict database access to application servers only

### Performance
- Adjust connection pool size based on expected load
- Monitor database performance and optimize queries
- Consider read replicas for high-traffic applications
- Regular database maintenance (VACUUM, ANALYZE)

### Backup
- Set up regular database backups
- Test backup restoration procedures
- Consider point-in-time recovery setup

### Monitoring
- Monitor connection pool usage
- Track query performance
- Set up alerts for database errors
- Monitor disk space and database size

## Development vs Production

### Development
- Use local PostgreSQL instance
- Smaller connection pool (10-20 connections)
- Detailed logging enabled
- SSL disabled for simplicity

### Production
- Use managed database service (AWS RDS, Google Cloud SQL, etc.)
- Larger connection pool (50+ connections)
- Error-only logging
- SSL enabled
- Connection encryption
- Regular backups
- Monitoring and alerting

## Testing

The application includes comprehensive database tests:

```bash
# Run all tests
npm test

# Run database-specific tests
npm test -- --grep "database"

# Run integration tests
npm test -- --grep "integration"
```

## Migration and Updates

The application includes a schema manager that handles:
- Automatic table creation
- Index management
- Schema version tracking
- Migration utilities

Future schema changes will be handled through migration scripts that preserve existing data.

## Support

If you encounter issues not covered in this guide:

1. Check the application logs for detailed error messages
2. Verify PostgreSQL logs for database-specific errors
3. Ensure all environment variables are correctly set
4. Test database connectivity using `psql` command-line tool

For additional help, refer to the PostgreSQL documentation: https://www.postgresql.org/docs/