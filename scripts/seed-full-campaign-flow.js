const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting full campaign flow seed...')

  // 1. 비즈니스 사용자 생성
  const businessPassword = await bcrypt.hash('password123', 10)
  const businessUser = await prisma.user.upsert({
    where: { email: 'testbusiness@linkpick.com' },
    update: {},
    create: {
      email: 'testbusiness@linkpick.com',
      password: businessPassword,
      name: '테스트 비즈니스',
      type: 'BUSINESS',
      status: 'ACTIVE',
      verified: true,
      businessProfile: {
        create: {
          companyName: '링크픽 테스트 회사',
          businessNumber: '123-45-67890',
          representativeName: '김대표',
          businessAddress: '서울시 강남구 테헤란로 123',
          businessCategory: '패션/뷰티',
          isVerified: true
        }
      }
    }
  })
  console.log('✅ Business user created:', businessUser.email)

  // 2. 인플루언서 사용자 생성
  const influencerPassword = await bcrypt.hash('password123', 10)
  const influencerUser = await prisma.user.upsert({
    where: { email: 'testinfluencer@linkpick.com' },
    update: {},
    create: {
      email: 'testinfluencer@linkpick.com',
      password: influencerPassword,
      name: '테스트 인플루언서',
      type: 'INFLUENCER',
      status: 'ACTIVE',
      verified: true,
      profile: {
        create: {
          bio: '패션과 뷰티를 사랑하는 인플루언서입니다.',
          instagram: '@test_influencer',
          instagramFollowers: 50000,
          youtube: 'TestInfluencer',
          youtubeSubscribers: 30000,
          categories: '패션,뷰티',
          isVerified: true
        }
      }
    }
  })
  console.log('✅ Influencer user created:', influencerUser.email)

  // 3. 캠페인 생성 (결제 완료 상태)
  const campaign = await prisma.campaign.create({
    data: {
      businessId: businessUser.id,
      title: '2025 여름 신상품 리뷰 캠페인',
      description: '새로운 여름 컬렉션을 소개해주실 인플루언서를 모집합니다. 제품을 직접 체험하고 솔직한 리뷰를 남겨주세요.',
      platform: 'instagram',
      budget: 1000000, // 100만원
      targetFollowers: 10000,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-31'),
      requirements: '패션 감각이 뛰어나고 사진 촬영에 능숙하신 분',
      hashtags: '#여름패션 #신상품 #링크픽',
      status: 'active', // 활성 상태
      isPaid: true, // 결제 완료
      location: '서울',
      viewCount: 250,
      maxApplicants: 10
    }
  })
  console.log('✅ Campaign created:', campaign.title)

  // 4. 결제 기록 생성
  const payment = await prisma.payment.create({
    data: {
      orderId: `ORDER_${Date.now()}`,
      campaignId: campaign.id,
      userId: businessUser.id,
      amount: 1200000, // 캠페인 예산 + 수수료 + VAT
      type: 'CAMPAIGN_PROMOTION',
      status: 'APPROVED',
      paymentMethod: 'CASH',
      paymentKey: 'TEST_PAYMENT_KEY',
      approvedAt: new Date(),
      metadata: JSON.stringify({
        campaignTitle: campaign.title,
        testPayment: true
      })
    }
  })
  console.log('✅ Payment created:', payment.orderId)

  // 5. 인플루언서 지원
  const application = await prisma.campaignApplication.create({
    data: {
      campaignId: campaign.id,
      influencerId: influencerUser.id,
      message: '안녕하세요! 패션 인플루언서로 활동하고 있습니다. 귀사의 제품을 매력적으로 소개할 자신이 있습니다.',
      proposedPrice: 800000, // 80만원 제안
      status: 'APPROVED' // 승인됨
    }
  })
  console.log('✅ Application created and approved')

  // 6. 콘텐츠 제출
  const content = await prisma.content.create({
    data: {
      applicationId: application.id,
      contentUrl: 'https://www.instagram.com/p/test_content_123',
      description: '여름 신상품 착용 후기입니다. 시원한 소재와 트렌디한 디자인이 매력적이에요!',
      platform: 'instagram',
      status: 'APPROVED', // 승인됨
      reviewedAt: new Date()
    }
  })
  console.log('✅ Content submitted and approved')

  // 7. 정산 생성 (콘텐츠 승인 시 자동 생성되는 것을 시뮬레이션)
  const settlement = await prisma.settlement.create({
    data: {
      influencerId: influencerUser.id,
      totalAmount: 800000, // 캠페인 예산의 80% (플랫폼 수수료 20% 제외)
      status: 'PENDING',
      bankAccount: JSON.stringify({
        bank: 'KB국민은행',
        accountNumber: '1234-5678-9012',
        accountHolder: '테스트 인플루언서'
      })
    }
  })
  console.log('✅ Settlement created')

  // 8. 정산 아이템 생성
  const settlementItem = await prisma.settlementItem.create({
    data: {
      settlementId: settlement.id,
      applicationId: application.id,
      amount: 800000,
      campaignTitle: campaign.title
    }
  })
  console.log('✅ Settlement item created')

  // 9. 추가 테스트 데이터: 정산 요청 및 완료된 정산
  
  // 정산 요청된 건
  const requestedSettlement = await prisma.settlement.create({
    data: {
      influencerId: influencerUser.id,
      totalAmount: 600000,
      status: 'REQUESTED',
      bankAccount: JSON.stringify({
        bank: 'KB국민은행',
        accountNumber: '1234-5678-9012',
        accountHolder: '테스트 인플루언서'
      }),
      adminNotes: '처리 중'
    }
  })

  // 완료된 정산
  const completedSettlement = await prisma.settlement.create({
    data: {
      influencerId: influencerUser.id,
      totalAmount: 500000,
      status: 'COMPLETED',
      bankAccount: JSON.stringify({
        bank: 'KB국민은행',
        accountNumber: '1234-5678-9012',
        accountHolder: '테스트 인플루언서'
      }),
      processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      adminNotes: '정상 처리 완료'
    }
  })

  console.log('✅ Additional settlements created')

  // 10. 파일 업로드 기록 (콘텐츠 이미지)
  const file = await prisma.file.create({
    data: {
      userId: influencerUser.id,
      filename: 'content-screenshot.jpg',
      originalName: '스크린샷.jpg',
      mimetype: 'image/jpeg',
      size: 1024000,
      path: '/uploads/content-screenshot.jpg',
      url: 'https://via.placeholder.com/800x800?text=Content+Screenshot',
      type: 'content'
    }
  })

  const contentMedia = await prisma.contentMedia.create({
    data: {
      contentId: content.id,
      fileId: file.id,
      type: 'image',
      order: 0
    }
  })
  console.log('✅ Content media created')

  console.log('\n🎉 Full campaign flow seed completed!')
  console.log('\n📋 Test accounts:')
  console.log('Business: testbusiness@linkpick.com / password123')
  console.log('Influencer: testinfluencer@linkpick.com / password123')
  console.log('\n💰 Settlement summary:')
  console.log('- Available for withdrawal: ₩800,000')
  console.log('- Processing: ₩600,000')
  console.log('- Completed: ₩500,000')
  console.log('- Total earnings: ₩1,900,000')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })