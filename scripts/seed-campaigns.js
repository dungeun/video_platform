const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find business user
  const businessUser = await prisma.users.findFirst({
    where: { type: 'BUSINESS' }
  })

  if (!businessUser) {
    console.error('No business user found')
    return
  }

  console.log('Found business user:', businessUser.email)

  // Create sample campaigns
  const campaigns = [
    {
      businessId: businessUser.id,
      title: '겨울 신상품 리뷰 캠페인',
      description: '2025년 겨울 신상품 패딩을 리뷰해주실 인플루언서를 모집합니다.',
      platform: 'instagram',
      budget: 5000000,
      targetFollowers: 10000,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-08-31'),
      requirements: '패션/뷰티 관심 팔로워 보유, 고품질 사진 촬영 가능',
      hashtags: '#겨울패딩 #신상품리뷰 #패션리뷰',
      status: 'active',
      location: '서울',
      viewCount: 150,
      maxApplicants: 20
    },
    {
      businessId: businessUser.id,
      title: '프리미엄 화장품 체험단 모집',
      description: '신제품 스킨케어 라인을 체험하고 솔직한 리뷰를 남겨주실 분을 찾습니다.',
      platform: 'youtube',
      budget: 8000000,
      targetFollowers: 50000,
      startDate: new Date('2025-07-20'),
      endDate: new Date('2025-09-20'),
      requirements: '뷰티 전문 채널 운영자, 영상 편집 능력 필수',
      hashtags: '#뷰티리뷰 #스킨케어 #화장품추천',
      status: 'active',
      location: '전국',
      viewCount: 320,
      maxApplicants: 15
    },
    {
      businessId: businessUser.id,
      title: '맛집 방문 리뷰 캠페인',
      description: '새로 오픈한 레스토랑을 방문하고 리뷰를 작성해주실 인플루언서를 모집합니다.',
      platform: 'blog',
      budget: 3000000,
      targetFollowers: 5000,
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-08-15'),
      requirements: '맛집 리뷰 경험 필수, 사진 촬영 능력',
      hashtags: '#맛집리뷰 #레스토랑 #신규오픈',
      status: 'pending',
      location: '강남구',
      viewCount: 89,
      maxApplicants: 10
    },
    {
      businessId: businessUser.id,
      title: '여행 상품 홍보 캠페인',
      description: '제주도 패키지 여행 상품을 체험하고 홍보해주실 인플루언서를 찾습니다.',
      platform: 'instagram',
      budget: 10000000,
      targetFollowers: 30000,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-10-31'),
      requirements: '여행 콘텐츠 제작 경험, 드론 촬영 가능자 우대',
      hashtags: '#제주여행 #여행스타그램 #패키지여행',
      status: 'active',
      location: '제주도',
      viewCount: 450,
      maxApplicants: 5
    },
    {
      businessId: businessUser.id,
      title: '피트니스 앱 리뷰 캠페인',
      description: '새로운 홈트레이닝 앱을 사용하고 리뷰해주실 피트니스 인플루언서를 모집합니다.',
      platform: 'tiktok',
      budget: 4000000,
      targetFollowers: 20000,
      startDate: new Date('2025-07-25'),
      endDate: new Date('2025-08-25'),
      requirements: '운동 관련 콘텐츠 제작 경험, 홈트레이닝 관심',
      hashtags: '#홈트 #피트니스 #운동앱',
      status: 'completed',
      location: '전국',
      viewCount: 280,
      maxApplicants: 25
    },
    {
      businessId: businessUser.id,
      title: '전자제품 언박싱 리뷰',
      description: '최신 무선이어폰 언박싱 및 사용 리뷰를 진행해주실 테크 인플루언서를 찾습니다.',
      platform: 'youtube',
      budget: 6000000,
      targetFollowers: 40000,
      startDate: new Date('2025-08-10'),
      endDate: new Date('2025-09-10'),
      requirements: '테크 리뷰 경험, 고품질 영상 제작 가능',
      hashtags: '#테크리뷰 #무선이어폰 #언박싱',
      status: 'paused',
      location: '전국',
      viewCount: 195,
      maxApplicants: 8
    },
    {
      businessId: businessUser.id,
      title: '키즈 용품 체험단',
      description: '유아용 교육 완구를 체험하고 리뷰해주실 육아 인플루언서를 모집합니다.',
      platform: 'instagram',
      budget: 3500000,
      targetFollowers: 15000,
      startDate: new Date('2025-07-30'),
      endDate: new Date('2025-08-30'),
      requirements: '육아 경험 필수, 3-7세 자녀 보유',
      hashtags: '#육아용품 #교육완구 #키즈리뷰',
      status: 'cancelled',
      location: '수도권',
      viewCount: 120,
      maxApplicants: 12
    },
    {
      businessId: businessUser.id,
      title: '삭제된 캠페인 테스트',
      description: '이 캠페인은 삭제된 상태입니다.',
      platform: 'instagram',
      budget: 2000000,
      targetFollowers: 5000,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
      requirements: '테스트용',
      hashtags: '#테스트',
      status: 'deleted',
      location: '서울',
      viewCount: 50,
      maxApplicants: 5
    }
  ]

  for (const campaign of campaigns) {
    const created = await prisma.campaigns.create({
      data: campaign
    })
    console.log('Created campaign:', created.title)
  }

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })