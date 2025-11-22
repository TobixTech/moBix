#!/bin/bash

echo "Syncing Prisma schema with Neon database..."

# Pull the current database schema
echo "Step 1: Pulling current database schema..."
npx prisma db pull

# Push the updated schema
echo "Step 2: Pushing updated schema to database..."
npx prisma db push --skip-generate

# Generate Prisma Client
echo "Step 3: Generating Prisma Client..."
npx prisma generate

echo "✅ Schema sync complete!"
