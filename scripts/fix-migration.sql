-- Fix failed migration issue
-- Remove the failed migration record from _prisma_migrations table

-- Check current migration status
SELECT * FROM _prisma_migrations 
WHERE migration_name = '20250128000000_add_platform_fee_rate';

-- Delete the failed migration record
DELETE FROM _prisma_migrations 
WHERE migration_name = '20250128000000_add_platform_fee_rate';

-- Verify deletion
SELECT * FROM _prisma_migrations 
ORDER BY started_at DESC;