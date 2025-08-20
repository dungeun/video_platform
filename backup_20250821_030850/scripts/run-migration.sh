#!/bin/bash

# Video Platform Migration Script
# This script runs the database migration to transform the platform

echo "🚀 Starting Video Platform Database Migration"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Create backups directory
mkdir -p backups
mkdir -p prisma/migrations

echo -e "${YELLOW}📦 Backing up current database schema...${NC}"

# Run the migration script
echo -e "${YELLOW}🔄 Running migration...${NC}"
node scripts/migrate-to-video-platform.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

# Generate Prisma client with new schema
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run Prisma db push to sync schema
echo -e "${YELLOW}🔄 Syncing database schema...${NC}"
npx prisma db push --skip-generate

echo -e "${GREEN}✨ Video Platform migration completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes in the database"
echo "2. Test the application locally"
echo "3. Deploy to Coolify when ready"
echo ""
echo "To rollback if needed:"
echo "- Restore from backup in backups/ directory"
echo "- Use the original schema.prisma.backup file"