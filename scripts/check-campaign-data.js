const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaignData() {
  try {
    // Check a specific campaign
    const campaignId = 'cmdkaqs7g002rfbr7b6fkasu8';
    
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          select: {
            id: true,
            email: true,
            name: true,
            businessProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
    
    console.log('Campaign data:');
    console.log('- ID:', campaign?.id);
    console.log('- Title:', campaign?.title);
    console.log('- Business ID:', campaign?.businessId);
    console.log('- Business:', campaign?.business);
    console.log('- Hashtags:', campaign?.hashtags);
    console.log('- Detailed Requirements:', campaign?.detailedRequirements);
    console.log('- Deliverables:', campaign?.deliverables);
    console.log('- Product Images:', campaign?.productImages);
    
    // Check if business exists
    if (campaign?.businessId) {
      const business = await prisma.users.findUnique({
        where: { id: campaign.businessId }
      });
      console.log('\nBusiness exists:', !!business);
      console.log('Business data:', business);
    }
    
    // Count all campaigns
    const totalCampaigns = await prisma.campaigns.count();
    console.log('\nTotal campaigns:', totalCampaigns);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignData();