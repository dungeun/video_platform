const { PrismaClient: SourcePrisma } = require('@prisma/client');
const { PrismaClient: TargetPrisma } = require('@prisma/client');

// Source DB (revu_platform)
const sourceDb = new SourcePrisma({
  datasources: {
    db: {
      url: "postgres://linkpick_user:LinkPick2024!@coolify.one-q.xyz:5433/revu_platform"
    }
  }
});

// Target DB (video_platform)  
const targetDb = new TargetPrisma({
  datasources: {
    db: {
      url: "postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@coolify.one-q.xyz:21871/postgres"
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting database migration from revu_platform to video_platform...\n');

  try {
    // 1. Check source DB connection
    console.log('📊 Checking source database tables...');
    const sourceTables = await sourceDb.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    console.log(`Found ${sourceTables.length} tables in source DB`);
    
    // 2. Check target DB connection
    console.log('\n📊 Checking target database...');
    const targetTables = await targetDb.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    console.log(`Found ${targetTables.length} tables in target DB`);

    // 3. List all tables to migrate
    console.log('\n📋 Tables to migrate:');
    sourceTables.forEach(t => console.log(`  - ${t.tablename}`));

    console.log('\n⚠️  WARNING: This will copy all data from revu_platform to video_platform.');
    console.log('Target database tables will be recreated with source data.');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 Migration starting...\n');

    // Get all data from source tables
    const tables = [
      'User', 'Account', 'Session', 'Campaign', 'Video', 
      'Proposal', 'Application', 'Message', 'Contract',
      'Review', 'Payment', 'Notification', 'Category',
      'Tag', 'CampaignCategory', 'CampaignTag', 'VideoTag',
      'UserFollow', 'CampaignView', 'VideoView', 'VideoLike',
      'Report', 'FAQ', 'Notice', 'SystemSetting', 'PricingPlan',
      'UserSubscription', 'Invoice', 'Template', 'TemplateUsage'
    ];

    for (const table of tables) {
      try {
        const modelName = table.charAt(0).toLowerCase() + table.slice(1);
        
        // Check if model exists
        if (!sourceDb[modelName]) {
          console.log(`⏭️  Skipping ${table} (model not found)`);
          continue;
        }

        console.log(`📥 Migrating ${table}...`);
        
        // Get data from source
        const data = await sourceDb[modelName].findMany();
        
        if (data.length === 0) {
          console.log(`   ✓ No data to migrate`);
          continue;
        }

        // Clear target table
        await targetDb[modelName].deleteMany();
        
        // Insert data to target
        if (data.length > 0) {
          await targetDb[modelName].createMany({
            data: data,
            skipDuplicates: true
          });
        }
        
        console.log(`   ✓ Migrated ${data.length} records`);
      } catch (error) {
        console.log(`   ❌ Error migrating ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrateData();