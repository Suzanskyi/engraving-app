#!/bin/bash

# Stop PostgreSQL container
echo "🛑 Stopping PostgreSQL container..."
docker-compose down

echo "✅ PostgreSQL container stopped"
echo "💡 Data is preserved in Docker volume 'postgres_data'"
echo "💡 To start again: ./docker-start.sh or ./start.sh"