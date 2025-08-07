#!/usr/bin/env node

/**
 * Migration script to transform campaign-based schema to video-based schema
 * This script should be run carefully in production
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed: ' + error.message, 'red');
    return false;
  }
}

async function backupCurrentSchema() {
  try {
    log('\n📦 Creating schema backup...', 'cyan');
    
    // Get current schema information
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupInfo = {
      timestamp,
      tables: tables.map(t => t.table_name),
      totalTables: tables.length,
    };
    
    // Save backup info
    const backupPath = path.join(__dirname, `../backups/schema-backup-${timestamp}.json`);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2));
    log(`✅ Schema backup created: ${backupPath}`, 'green');
    
    return true;
  } catch (error) {
    log('❌ Backup failed: ' + error.message, 'red');
    return false;
  }
}

async function checkExistingData() {
  try {
    log('\n📊 Checking existing data...', 'cyan');
    
    const counts = {
      campaigns: await prisma.campaigns.count().catch(() => 0),
      videos: await prisma.videos.count().catch(() => 0),
      youtubeVideos: await prisma.youtube_videos.count().catch(() => 0),
      users: await prisma.users.count().catch(() => 0),
      channels: await prisma.channels.count().catch(() => 0),
    };
    
    log('Current data counts:', 'yellow');
    Object.entries(counts).forEach(([table, count]) => {
      log(`  ${table}: ${count}`, 'yellow');
    });
    
    return counts;
  } catch (error) {
    log('⚠️  Error checking data: ' + error.message, 'yellow');
    return {};
  }
}

async function createVideoCategories() {
  try {
    log('\n🏷️  Creating video categories...', 'cyan');
    
    const categories = [
      { name: '엔터테인먼트', slug: 'entertainment', description: '음악, 코미디, 예능 등', displayOrder: 1 },
      { name: '게임', slug: 'gaming', description: '게임 플레이, 리뷰, 공략', displayOrder: 2 },
      { name: '교육', slug: 'education', description: '강의, 튜토리얼, 학습 콘텐츠', displayOrder: 3 },
      { name: '스포츠', slug: 'sports', description: '스포츠 경기, 하이라이트, 분석', displayOrder: 4 },
      { name: '뉴스', slug: 'news', description: '시사, 정치, 경제 뉴스', displayOrder: 5 },
      { name: '음악', slug: 'music', description: '뮤직비디오, 라이브, 커버', displayOrder: 6 },
      { name: '영화/애니메이션', slug: 'film', description: '영화 리뷰, 예고편, 애니메이션', displayOrder: 7 },
      { name: '과학기술', slug: 'tech', description: 'IT, 과학, 기술 리뷰', displayOrder: 8 },
      { name: '요리', slug: 'cooking', description: '레시피, 요리 방법, 맛집', displayOrder: 9 },
      { name: '뷰티/패션', slug: 'beauty', description: '메이크업, 패션, 스타일링', displayOrder: 10 },
      { name: '여행', slug: 'travel', description: '여행 브이로그, 여행 정보', displayOrder: 11 },
      { name: '자동차', slug: 'auto', description: '자동차 리뷰, 시승기', displayOrder: 12 },
      { name: '반려동물', slug: 'pets', description: '펫 브이로그, 훈련, 정보', displayOrder: 13 },
      { name: '부동산/재테크', slug: 'finance', description: '부동산, 주식, 재테크 정보', displayOrder: 14 },
      { name: '라이프스타일', slug: 'lifestyle', description: '일상, 브이로그, 라이프스타일', displayOrder: 15 },
    ];
    
    // Use raw SQL to create categories table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS video_categories (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(500),
        parent_id VARCHAR(36),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        video_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Insert categories
    for (const category of categories) {
      await prisma.$executeRaw`
        INSERT INTO video_categories (name, slug, description, display_order)
        VALUES (${category.name}, ${category.slug}, ${category.description}, ${category.displayOrder})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }
    
    log('✅ Video categories created', 'green');
    return true;
  } catch (error) {
    log('⚠️  Error creating categories: ' + error.message, 'yellow');
    return false;
  }
}

async function migrateCampaignsToVideos() {
  try {
    log('\n🔄 Migrating campaigns to videos...', 'cyan');
    
    // Check if campaigns table exists
    const campaignsExist = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
      );
    `;
    
    if (!campaignsExist[0].exists) {
      log('⚠️  Campaigns table does not exist, skipping migration', 'yellow');
      return false;
    }
    
    // Get all campaigns
    const campaigns = await prisma.campaigns.findMany({
      include: {
        business: {
          include: {
            businessProfile: true,
          },
        },
      },
    });
    
    log(`Found ${campaigns.length} campaigns to migrate`, 'yellow');
    
    let migrated = 0;
    let skipped = 0;
    
    for (const campaign of campaigns) {
      try {
        // Check if channel exists for this business
        let channel = await prisma.channels.findUnique({
          where: { userId: campaign.businessId },
        });
        
        // Create channel if it doesn't exist
        if (!channel) {
          const businessProfile = campaign.business?.businessProfile;
          channel = await prisma.channels.create({
            data: {
              id: campaign.businessId + '-channel',
              userId: campaign.businessId,
              name: businessProfile?.companyName || campaign.business.name,
              handle: campaign.businessId.substring(0, 20),
              description: businessProfile?.businessCategory || 'Business Channel',
              isVerified: businessProfile?.isVerified || false,
            },
          });
        }
        
        // Check if video already exists
        const existingVideo = await prisma.videos.findUnique({
          where: { id: campaign.id },
        }).catch(() => null);
        
        if (existingVideo) {
          skipped++;
          continue;
        }
        
        // Create video from campaign
        await prisma.videos.create({
          data: {
            id: campaign.id,
            channelId: channel.id,
            title: campaign.title,
            description: campaign.description,
            thumbnailUrl: campaign.imageUrl || 'https://via.placeholder.com/640x360',
            videoUrl: campaign.imageUrl || 'https://via.placeholder.com/640x360',
            duration: Math.floor(Math.random() * 600 + 60), // Random 1-10 minutes
            viewCount: campaign.viewCount || 0,
            status: campaign.status === 'ACTIVE' ? 'published' : 'draft',
            publishedAt: campaign.createdAt,
            category: 'general',
            tags: campaign.hashtags || [],
            isPremium: campaign.isPaid || false,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
          },
        });
        
        migrated++;
      } catch (error) {
        log(`  ⚠️  Failed to migrate campaign ${campaign.id}: ${error.message}`, 'yellow');
      }
    }
    
    log(`✅ Migrated ${migrated} campaigns to videos (${skipped} skipped)`, 'green');
    return true;
  } catch (error) {
    log('❌ Migration failed: ' + error.message, 'red');
    return false;
  }
}

async function updateSiteConfig() {
  try {
    log('\n⚙️  Updating site configuration...', 'cyan');
    
    const configs = [
      {
        key: 'platform_type',
        value: JSON.stringify({ type: 'video', name: 'VideoPick' }),
      },
      {
        key: 'video_upload_settings',
        value: JSON.stringify({
          maxFileSizeMb: 5000,
          allowedFormats: ['mp4', 'webm', 'mov'],
          maxDurationMinutes: 60,
        }),
      },
      {
        key: 'monetization_settings',
        value: JSON.stringify({
          adRevenueShare: 55,
          minWatchTimeHours: 4000,
          minSubscribers: 1000,
        }),
      },
      {
        key: 'streaming_settings',
        value: JSON.stringify({
          rtmpServer: 'rtmp://stream.videopick.com/live',
          maxBitrate: 6000,
          maxResolution: '1080p',
        }),
      },
    ];
    
    for (const config of configs) {
      await prisma.site_config.upsert({
        where: { key: config.key },
        update: { value: config.value, updatedAt: new Date() },
        create: {
          id: Math.random().toString(36).substring(7),
          key: config.key,
          value: config.value,
          updatedAt: new Date(),
        },
      });
    }
    
    log('✅ Site configuration updated', 'green');
    return true;
  } catch (error) {
    log('⚠️  Error updating config: ' + error.message, 'yellow');
    return false;
  }
}

async function createSampleVideos() {
  try {
    log('\n🎬 Creating sample videos...', 'cyan');
    
    // Check if we have any channels
    const channelCount = await prisma.channels.count();
    if (channelCount === 0) {
      log('⚠️  No channels found, creating sample channel...', 'yellow');
      
      // Get admin user or first user
      const adminUser = await prisma.users.findFirst({
        where: { type: 'ADMIN' },
      });
      
      if (!adminUser) {
        log('⚠️  No admin user found, skipping sample videos', 'yellow');
        return false;
      }
      
      // Create sample channel
      await prisma.channels.create({
        data: {
          id: 'sample-channel',
          userId: adminUser.id,
          name: 'VideoPick Official',
          handle: 'videopick',
          description: '비디오픽 공식 채널입니다',
          isVerified: true,
          subscriberCount: 10000,
        },
      });
    }
    
    const channel = await prisma.channels.findFirst();
    
    const sampleVideos = [
      {
        title: '2024년 최고의 게임 TOP 10',
        description: '올해 가장 인기 있었던 게임들을 소개합니다',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop',
        category: 'gaming',
        duration: 720,
        viewCount: 150000,
        likeCount: 3200,
        isPremium: false,
        isFeatured: true,
      },
      {
        title: '초보자를 위한 주식 투자 가이드',
        description: '주식 투자를 시작하는 분들을 위한 완벽 가이드',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&h=360&fit=crop',
        category: 'finance',
        duration: 1800,
        viewCount: 98000,
        likeCount: 2100,
        isPremium: true,
        isFeatured: false,
      },
      {
        title: '서울 맛집 투어 VLOG',
        description: '서울의 숨은 맛집들을 찾아다니는 브이로그',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&h=360&fit=crop',
        category: 'cooking',
        duration: 900,
        viewCount: 75000,
        likeCount: 1850,
        isPremium: false,
        isFeatured: true,
      },
    ];
    
    let created = 0;
    for (const videoData of sampleVideos) {
      try {
        await prisma.videos.create({
          data: {
            id: 'sample-' + Math.random().toString(36).substring(7),
            channelId: channel.id,
            ...videoData,
            videoUrl: videoData.thumbnailUrl, // Use thumbnail as placeholder
            status: 'published',
            publishedAt: new Date(),
            tags: [],
          },
        });
        created++;
      } catch (error) {
        log(`  ⚠️  Failed to create sample video: ${error.message}`, 'yellow');
      }
    }
    
    log(`✅ Created ${created} sample videos`, 'green');
    return true;
  } catch (error) {
    log('⚠️  Error creating sample videos: ' + error.message, 'yellow');
    return false;
  }
}

async function main() {
  log('\n🚀 Starting Video Platform Migration', 'bright');
  log('=' .repeat(50), 'cyan');
  
  // Check database connection
  if (!await checkDatabaseConnection()) {
    process.exit(1);
  }
  
  // Create backup
  if (!await backupCurrentSchema()) {
    log('\n⚠️  Continue without backup? This is risky! (y/N)', 'yellow');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise(resolve => {
      readline.question('', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      log('Migration cancelled', 'yellow');
      process.exit(0);
    }
  }
  
  // Check existing data
  const dataCounts = await checkExistingData();
  
  // Run migrations
  const steps = [
    { name: 'Create video categories', fn: createVideoCategories },
    { name: 'Migrate campaigns to videos', fn: migrateCampaignsToVideos },
    { name: 'Update site configuration', fn: updateSiteConfig },
    { name: 'Create sample videos', fn: createSampleVideos },
  ];
  
  let successCount = 0;
  for (const step of steps) {
    log(`\n▶️  ${step.name}...`, 'blue');
    const result = await step.fn();
    if (result) {
      successCount++;
    }
  }
  
  // Summary
  log('\n' + '=' .repeat(50), 'cyan');
  log('📊 Migration Summary', 'bright');
  log(`✅ Completed ${successCount}/${steps.length} steps`, successCount === steps.length ? 'green' : 'yellow');
  
  // Final data check
  log('\n📊 Final data counts:', 'cyan');
  const finalCounts = await checkExistingData();
  
  log('\n✨ Migration completed!', 'green');
  log('Next steps:', 'yellow');
  log('1. Run: npm run build', 'yellow');
  log('2. Test the application thoroughly', 'yellow');
  log('3. Deploy to Coolify', 'yellow');
  
  await prisma.$disconnect();
}

// Run migration
main().catch(async (error) => {
  log('\n❌ Migration failed with error:', 'red');
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});