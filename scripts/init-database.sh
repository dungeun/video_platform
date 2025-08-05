#!/bin/bash

# VideoPick Database Initialization Script
# This script directly creates tables without using Prisma migrations

echo "Initializing VideoPick database..."

# Database connection string
DATABASE_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"

# Use prisma db push to sync schema directly
echo "Syncing database schema with Prisma..."
DATABASE_URL=$DATABASE_URL npx prisma db push --accept-data-loss --skip-generate

echo "Database initialization complete!"