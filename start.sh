#!/bin/bash

# SuzEngrave Startup Script with Docker PostgreSQL
# This script starts PostgreSQL in Docker and then starts the application

echo "🚀 Starting SuzEngrave with Docker PostgreSQL..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env file exists, if not copy from example
if [ ! -f .env ]; then
    echo "📋 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created with Docker PostgreSQL settings"
fi

# Start PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0

while ! docker-compose exec -T postgres pg_isready -U postgres -d suzengrave > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        echo "📋 Check container logs: docker-compose logs postgres"
        exit 1
    fi
    
    echo "   Waiting... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

echo "✅ PostgreSQL is ready"

# Build the React app
echo "🔨 Building React application..."
npm run build

# Start the server
echo "🌟 Starting server with PostgreSQL..."
echo "📍 Application will be available at: http://localhost:3001"
echo "📍 API will be available at: http://localhost:3001/api"
echo "📍 PostgreSQL available at: localhost:5432"
echo ""
echo "💡 To stop PostgreSQL: docker-compose down"
echo "💡 To view logs: docker-compose logs -f"
echo ""
npm run server