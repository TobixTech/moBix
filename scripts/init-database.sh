#!/bin/bash
# Database initialization script for moBix

echo "🚀 Initializing moBix database..."

# Push Prisma schema to database
echo "📦 Creating database tables..."
npx prisma db push --skip-generate

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

# Seed database with initial data
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Database initialization complete!"
echo ""
echo "🔑 Admin Access Key: MOBIX_SECRET_2024"
echo "📍 Use this at: /admin/access-key"
