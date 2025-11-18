#!/bin/bash

# Reset PostgreSQL container and data
echo "⚠️  This will DELETE ALL DATA in the PostgreSQL container!"
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Stopping and removing PostgreSQL container..."
    docker-compose down -v
    
    echo "🗑️  Removing Docker volume..."
    docker volume rm suzengrave_postgres_data 2>/dev/null || true
    
    echo "✅ PostgreSQL container and data reset"
    echo "💡 Run ./start.sh to start fresh"
else
    echo "❌ Reset cancelled"
fi