const { PrismaClient } = require('@prisma/client');

// Source DB (linkpick database - current .env.local)
const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:7MBfWpMyKVevUr6qmbK06WvrA6ENlqWvQ5QYP1q1d4hBngbdL7DQI8RHU5ePa0ua@mco08g444s00gkkw0wso40sk:5432/postgres"
    }
  }
});

// Target DB (video database - target for migration)
const targetDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting database migration from linkpick DB to video DB...\n');
  console.log('Source: postgresql-database-linkpick (mco08g444s00gkkw0wso40sk)');
  console.log('Target: postgresql-database-video (i4sccwsosskookos4084ogkc)\n');

  try {
    // First, apply schema to target DB
    console.log('📋 Applying schema to target database...');
    
    // Check connections
    console.log('✅ Checking source database connection...');
    await sourceDb.$connect();
    console.log('✅ Source database connected');
    
    console.log('✅ Checking target database connection...');
    await targetDb.$connect();
    console.log('✅ Target database connected\n');

    // Get table information
    const sourceTables = await sourceDb.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma%'
      ORDER BY tablename;
    `;
    
    console.log(`📊 Found ${sourceTables.length} tables to migrate:\n`);
    sourceTables.forEach(t => console.log(`  - ${t.tablename}`));

    console.log('\n⚠️  WARNING: This will copy all data from linkpick DB to video DB.');
    console.log('Target database will be cleared and recreated with source data.');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 Starting migration...\n');

    // Migrate data in correct order (handle foreign key dependencies)
    const tableOrder = [
      // Independent tables first
      'User',
      'Category',
      'Tag',
      'SystemSetting',
      'FAQ',
      'Notice',
      'PricingPlan',
      'Template',
      
      // Dependent tables
      'Account',
      'Session',
      'Campaign',
      'Video',
      'Proposal',
      'Application',
      'Message',
      'Contract',
      'Review',
      'Payment',
      'Notification',
      'CampaignCategory',
      'CampaignTag',
      'VideoTag',
      'UserFollow',
      'CampaignView',
      'VideoView', 
      'VideoLike',
      'Report',
      'UserSubscription',
      'Invoice',
      'TemplateUsage'
    ];

    for (const table of tableOrder) {
      try {
        const modelName = table.charAt(0).toLowerCase() + table.slice(1);
        
        // Check if model exists
        if (!sourceDb[modelName]) {
          console.log(`⏭️  Skipping ${table} (model not found)`);
          continue;
        }

        console.log(`📥 Migrating ${table}...`);
        
        // Get count from source
        const sourceCount = await sourceDb[modelName].count();
        
        if (sourceCount === 0) {
          console.log(`   ✓ No data to migrate`);
          continue;
        }

        // Clear target table
        try {
          await targetDb[modelName].deleteMany();
        } catch (e) {
          // Table might not exist yet
        }

        // Get data from source and migrate in batches
        const batchSize = 100;
        let offset = 0;
        let migrated = 0;

        while (offset < sourceCount) {
          const batch = await sourceDb[modelName].findMany({
            skip: offset,
            take: batchSize
          });

          if (batch.length > 0) {
            await targetDb[modelName].createMany({
              data: batch,
              skipDuplicates: true
            });
            migrated += batch.length;
          }

          offset += batchSize;
          process.stdout.write(`\r   ✓ Migrated ${migrated}/${sourceCount} records`);
        }
        
        console.log(''); // New line after progress
      } catch (error) {
        console.log(`\n   ❌ Error migrating ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Delete or rename .env.local file');
    console.log('2. Update .env to use the video database connection');
    console.log('3. Restart the application');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

// Run migration
migrateData();