import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function verifyData() {
  console.log('🔍 Verifying sample data in database...\n')
  
  try {
    // Count users by type
    const businessCount = await prisma.users.count({
      where: { type: 'BUSINESS' }
    })
    
    const influencerCount = await prisma.users.count({
      where: { type: 'INFLUENCER' }
    })
    
    console.log(`👥 Users:`)
    console.log(`   - Business users: ${businessCount}`)
    console.log(`   - Influencers: ${influencerCount}`)
    console.log(`   - Total users: ${businessCount + influencerCount}\n`)
    
    // Count campaigns by status
    const campaignsByStatus = await prisma.campaigns.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log(`📋 Campaigns by status:`)
    campaignsByStatus.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status}`)
    })
    
    const totalCampaigns = await prisma.campaigns.count()
    console.log(`   - Total campaigns: ${totalCampaigns}\n`)
    
    // Count campaign applications by status
    const applicationsByStatus = await prisma.campaign_applications.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log(`📝 Campaign applications by status:`)
    applicationsByStatus.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status}`)
    })
    
    const totalApplications = await prisma.campaign_applications.count()
    console.log(`   - Total campaign_applications: ${totalApplications}\n`)
    
    // Count content by status
    const contentByStatus = await prisma.contents.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log(`📄 Content by status:`)
    contentByStatus.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status}`)
    })
    
    const totalContent = await prisma.contents.count()
    console.log(`   - Total content: ${totalContent}\n`)
    
    // Count payments by status
    const paymentsByStatus = await prisma.payments.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log(`💰 Payments by status:`)
    paymentsByStatus.forEach(group => {
      console.log(`   - ${group.status}: ${group._count.status}`)
    })
    
    const totalPayments = await prisma.payments.count()
    console.log(`   - Total payments: ${totalPayments}\n`)
    
    // Count other data
    const notificationCount = await prisma.notifications.count()
    const followCount = await prisma.follows.count()
    const postCount = await prisma.posts.count()
    
    console.log(`📊 Other data:`)
    console.log(`   - Notifications: ${notificationCount}`)
    console.log(`   - Follow relationships: ${followCount}`)
    console.log(`   - Community posts: ${postCount}\n`)
    
    // Sample queries to demonstrate relationships
    console.log(`🔗 Sample relationship queries:`)
    
    // Get a business with their campaigns
    const businessWithCampaigns = await prisma.users.findFirst({
      where: { type: 'BUSINESS' },
      include: {
        campaigns: {
          take: 3,
          select: {
            id: true,
            title: true,
            status: true,
            budget: true
          }
        },
        business_profiles: {
          select: {
            companyName: true,
            businessCategory: true
          }
        }
      }
    })
    
    if (businessWithCampaigns) {
      console.log(`   - Business: ${businessWithCampaigns.business_profiles?.companyName}`)
      console.log(`     Campaigns (first 3):`)
      businessWithCampaigns.campaigns.forEach(campaign => {
        console.log(`       • ${campaign.title} (${campaign.status}) - ₩${campaign.budget.toLocaleString()}`)
      })
      console.log()
    }
    
    // Get an influencer with their applications
    const influencerWithApplications = await prisma.users.findFirst({
      where: { type: 'INFLUENCER' },
      include: {
        campaign_applications: {
          take: 3,
          select: {
            id: true,
            status: true,
            proposedPrice: true,
            campaigns: {
              select: {
                title: true
              }
            }
          }
        },
        profiles: {
          select: {
            instagramFollowers: true,
            averageEngagementRate: true
          }
        }
      }
    })
    
    if (influencerWithApplications) {
      console.log(`   - Influencer: ${influencerWithApplications.name}`)
      console.log(`     Instagram followers: ${influencerWithApplications.profiles?.instagramFollowers?.toLocaleString()}`)
      console.log(`     Engagement rate: ${influencerWithApplications.profiles?.averageEngagementRate}%`)
      console.log(`     Applications (first 3):`)
      influencerWithApplications.campaign_applications.forEach(app => {
        console.log(`       • ${app.campaigns.title} (${app.status}) - ₩${app.proposedPrice?.toLocaleString()}`)
      })
      console.log()
    }
    
    // Get campaign with applications and content
    const campaignWithDetails = await prisma.campaigns.findFirst({
      where: {
        campaign_applications: {
          some: {
            status: 'APPROVED'
          }
        }
      },
      include: {
        users: {
          select: {
            name: true,
            business_profiles: {
              select: {
                companyName: true
              }
            }
          }
        },
        campaign_applications: {
          where: {
            status: 'APPROVED'
          },
          take: 3,
          select: {
            id: true,
            users: {
              select: {
                name: true
              }
            },
            contents: {
              take: 2,
              select: {
                platform: true,
                status: true
              }
            }
          }
        }
      }
    })
    
    if (campaignWithDetails) {
      console.log(`   - Campaign: ${campaignWithDetails.title}`)
      console.log(`     Business: ${campaignWithDetails.users.business_profiles?.companyName}`)
      console.log(`     Budget: ₩${campaignWithDetails.budget.toLocaleString()}`)
      console.log(`     Approved applications (first 3):`)
      campaignWithDetails.campaign_applications.forEach(app => {
        console.log(`       • ${app.users.name}`)
        app.contents.forEach(content => {
          console.log(`         - ${content.platform} content (${content.status})`)
        })
      })
      console.log()
    }
    
    console.log('✅ Database verification completed successfully!')
    console.log('🎉 All sample data has been inserted and is accessible via relationships!')
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })