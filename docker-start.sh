#!/bin/bash

# Start only the PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
while ! docker-compose exec -T postgres pg_isready -U postgres -d suzengrave > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"
echo "📍 PostgreSQL available at: localhost:5432"
echo "📍 Database: suzengrave"
echo "📍 User: postgres"
echo "📍 Password: suzengrave123"
echo ""
echo "💡 To connect: psql -h localhost -U postgres -d suzengrave"
echo "💡 To stop: docker-compose down"
echo "💡 To view logs: docker-compose logs -f postgres"