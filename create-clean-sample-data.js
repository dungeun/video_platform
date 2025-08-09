#!/usr/bin/env node

const fs = require('fs');

const cleanContent = `import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const SAMPLE_PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER']
const BUSINESS_CATEGORIES = ['패션', '뷰티', '음식', '여행', '기술', '라이프스타일', '스포츠', '게임', '교육', '헬스']
const INFLUENCER_CATEGORIES = ['패션', '뷰티', '음식', '여행', '기술', '라이프스타일', '스포츠', '게임', '교육', '헬스']
const CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']

async function createSampleBusinessUsers() {
  console.log('Creating 30 business users...')
  const businesses = []
  
  for (let i = 0; i < 30; i++) {
    const companyName = faker.company.name()
    const business = await prisma.users.create({
      data: {
        id: \`user-business-\${i + 1}\`,
        email: faker.internet.email(),
        password: '$2b$10$dummy.hash.for.testing',
        name: faker.person.fullName(),
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        business_profiles: {
          create: {
            id: \`business-profile-\${i + 1}\`,
            companyName,
            businessNumber: faker.string.numeric(10),
            representativeName: faker.person.fullName(),
            businessAddress: faker.location.streetAddress(),
            businessCategory: faker.helpers.arrayElement(BUSINESS_CATEGORIES),
            isVerified: faker.datatype.boolean(0.7),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      include: {
        business_profiles: true
      }
    })
    businesses.push(business)
  }
  
  console.log(\`Created \${businesses.length} business users\`)
  return businesses
}

async function createSampleInfluencers() {
  console.log('Creating 30 influencer users...')
  const influencers = []
  
  for (let i = 0; i < 30; i++) {
    const categories = faker.helpers.arrayElements(INFLUENCER_CATEGORIES, { min: 1, max: 3 })
    const influencer = await prisma.users.create({
      data: {
        id: \`user-influencer-\${i + 1}\`,
        email: faker.internet.email(),
        password: '$2b$10$dummy.hash.for.testing',
        name: faker.person.fullName(),
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profiles: {
          create: {
            id: \`profile-\${i + 1}\`,
            bio: faker.lorem.paragraph(),
            profileImage: faker.image.avatar(),
            phone: faker.phone.number(),
            instagram: \`@\${faker.internet.userName()}\`,
            instagramFollowers: faker.number.int({ min: 1000, max: 500000 }),
            youtube: \`\${faker.internet.userName()}\`,
            youtubeSubscribers: faker.number.int({ min: 500, max: 100000 }),
            tiktok: \`@\${faker.internet.userName()}\`,
            tiktokFollowers: faker.number.int({ min: 2000, max: 200000 }),
            averageEngagementRate: faker.number.float({ min: 1.5, max: 8.5, fractionDigits: 1 }),
            categories: JSON.stringify(categories),
            isVerified: faker.datatype.boolean(0.6),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      include: {
        profiles: true
      }
    })
    influencers.push(influencer)
  }
  
  console.log(\`Created \${influencers.length} influencer users\`)
  return influencers
}

async function createSampleCampaigns(businesses: any[]) {
  console.log('Creating 30 campaigns...')
  const campaigns = []
  
  for (let i = 0; i < 30; i++) {
    const business = faker.helpers.arrayElement(businesses)
    const startDate = faker.date.future({ years: 0.5 })
    const endDate = faker.date.future({ years: 0.5, refDate: startDate })
    const budget = faker.number.float({ min: 500000, max: 10000000, fractionDigits: 0 })
    
    const hashtags = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
      \`#\${faker.word.noun()}\`
    )
    
    const campaign = await prisma.campaigns.create({
      data: {
        id: \`campaign-\${i + 1}\`,
        businessId: business.id,
        title: \`\${faker.company.buzzPhrase()} 캠페인\`,
        description: faker.lorem.paragraphs(2),
        platform: faker.helpers.arrayElement(SAMPLE_PLATFORMS),
        budget,
        targetFollowers: faker.number.int({ min: 10000, max: 500000 }),
        startDate,
        endDate,
        requirements: faker.lorem.paragraph(),
        hashtags: JSON.stringify(hashtags),
        imageUrl: faker.image.url(),
        status: faker.helpers.arrayElement(CAMPAIGN_STATUSES),
        isPaid: faker.datatype.boolean(0.3),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    campaigns.push(campaign)
  }
  
  console.log(\`Created \${campaigns.length} campaigns\`)
  return campaigns
}

async function main() {
  console.log('🚀 Starting sample data generation...')
  
  try {
    // Create users
    const businesses = await createSampleBusinessUsers()
    const influencers = await createSampleInfluencers()
    
    // Create campaigns
    const campaigns = await createSampleCampaigns(businesses)
    
    console.log('\\n✅ Sample data generation completed successfully!')
    console.log(\`📊 Generated:\`)
    console.log(\`   - \${businesses.length} business users\`)
    console.log(\`   - \${influencers.length} influencers\`)
    console.log(\`   - \${campaigns.length} campaigns\`)
    
  } catch (error) {
    console.error('❌ Error generating sample data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { main as generateSampleData }
`;

const filePath = '/Users/admin/new_project/video_platform/prisma/seed-sample-data.ts';
console.log('🚀 Creating clean seed-sample-data.ts...');

fs.writeFileSync(filePath, cleanContent, 'utf8');

console.log('✅ Created clean seed-sample-data.ts');