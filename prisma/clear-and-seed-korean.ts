import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// 한국 브랜드/업체명
const KOREAN_COMPANIES = [
  'CJ제일제당', '롯데', '삼성전자', '네이버', '카카오', 
  '현대자동차', '기아', 'SK하이닉스', 'LG전자', '포스코',
  '한화', '신세계', '이마트', '쿠팡', '배달의민족',
  '토스', '넷플릭스코리아', '유튜브코리아', '인스타그램코리아', '틱톡코리아',
  '올리브영', '이니스프리', '에뛰드하우스', '더페이스샵', '토니앤가이',
  '스타벅스코리아', '투썸플레이스', '파리바게뜨', '던킨도너츠', '맘스터치'
]

// 한국 브랜드 카테고리
const KOREAN_CATEGORIES = ['패션', '뷰티', '음식', '여행', '기술', '라이프스타일', '스포츠', '게임', '교육', '헬스']

// 한국 인플루언서 닉네임
const KOREAN_INFLUENCER_NAMES = [
  '뷰티구루민지', '패션왕수진', '요리마스터준호', '여행러버지은',
  '게임킹태민', '운동천재소영', '테크리뷰어동현', '라이프스타일리나',
  '카페투어혜원', '맛집탐방기웅', '뷰티팁제시카', '패션하울러윤아',
  '홈트레이너재훈', '여행블로거서연', '게임스트리머현수', '요리연구가미나',
  '뷰티유튜버하늘', '패션인플루언서다은', '여행인플루언서지훈', '푸드블로거윤정',
  '뷰티크리에이터수아', '패션스타일리스트민수', '여행유튜버예린', '맛집리뷰어정훈',
  '뷰티인플루언서채원', '패션블로거태양', '여행크리에이터소민', '푸드스타일리스트하준',
  '뷰티리뷰어나연', '패션유튜버민재'
]

// 한국 캠페인 제목 템플릿
const KOREAN_CAMPAIGN_TITLES = [
  '{brand} 신제품 런칭 기념 체험단 모집',
  '{brand} 브랜드 앰버서더 모집',
  '{brand} {season} 컬렉션 소개 캠페인',
  '{brand} 제품 리뷰 및 체험 이벤트',
  '{brand} SNS 마케팅 파트너 모집',
  '{brand} 인플루언서 협업 프로젝트',
  '{brand} 신상품 홍보 캠페인',
  '{brand} 브랜드 스토리 공유 이벤트',
  '{brand} 고객 리뷰 작성 캠페인',
  '{brand} 소셜미디어 챌린지'
]

const SEASONS = ['봄', '여름', '가을', '겨울', '신년', '상반기', '하반기']

// 한국어 캠페인 설명 템플릿
const KOREAN_DESCRIPTIONS = [
  '{brand}에서 새로운 {category} 제품을 출시합니다. 트렌디하고 실용적인 제품으로 일상을 더욱 풍요롭게 만들어보세요.',
  '혁신적인 기술과 세련된 디자인이 결합된 {brand}의 신제품을 체험해보세요. 여러분의 솔직한 리뷰를 기다립니다.',
  '{brand}와 함께하는 특별한 캠페인입니다. 제품을 직접 사용해보시고 SNS에 후기를 공유해주세요.',
  '품질과 가치를 중시하는 {brand}에서 신뢰할 수 있는 인플루언서를 찾습니다. 함께 브랜드 가치를 전달해주세요.',
  '{brand}의 새로운 도전에 함께하세요. 창의적이고 참신한 콘텐츠로 브랜드를 알려주실 분을 모집합니다.'
]

// 커뮤니티 게시글 제목
const COMMUNITY_TITLES = [
  '인플루언서 활동 시작하는 분들에게 드리는 꿀팁!',
  '캠페인 지원할 때 주의사항 정리해드려요',
  '브랜드 협업 제안서 작성법 공유합니다',
  '인스타그램 팔로워 늘리는 방법 (실제 경험담)',
  '유튜브 수익화 달성 후기 및 노하우',
  '틱톡 바이럴 영상 만드는 팁 모음',
  '브랜드 담당자와 소통하는 방법',
  '콘텐츠 기획부터 업로드까지 전체 프로세스',
  '협찬 제품 리뷰 작성 시 주의점',
  '인플루언서 수익 관리 및 세금 신고 팁',
  '좋은 사진 촬영을 위한 조명 및 배경 설정',
  '영상 편집 프로그램 추천 및 사용법',
  '해시태그 효과적으로 활용하는 방법',
  '팔로워와 소통하는 댓글 관리법',
  '크리에이터 번아웃 극복 경험담'
]

async function clearExistingData() {
  console.log('🗑️ 기존 데이터 삭제 중...')
  
  // 관련 데이터를 순서대로 삭제 (외래키 제약 조건 고려)
  await prisma.postLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.contentMedia.deleteMany()
  await prisma.content.deleteMany()
  await prisma.settlementItem.deleteMany()
  await prisma.settlement.deleteMany()
  await prisma.refund.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.campaignApplication.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.file.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.businessProfile.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ 기존 데이터 삭제 완료')
}

async function createAdminUser() {
  console.log('👨‍💼 관리자 계정 생성 중...')
  
  const hashedPassword = await bcrypt.hash('admin123!', 10)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@linkpick.co.kr',
      password: hashedPassword,
      name: 'LinkPick 관리자',
      type: 'ADMIN',
      status: 'ACTIVE',
      verified: true,
      lastLogin: new Date()
    }
  })
  
  console.log('✅ 관리자 계정 생성 완료')
  return admin
}

async function createKoreanBusinessUsers() {
  console.log('🏢 한국 업체 사용자 30개 생성 중...')
  const businesses = []
  
  for (let i = 0; i < 30; i++) {
    const companyName = KOREAN_COMPANIES[i % KOREAN_COMPANIES.length]
    const category = KOREAN_CATEGORIES[i % KOREAN_CATEGORIES.length]
    
    const business = await prisma.user.create({
      data: {
        email: `business${i + 1}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.kr`,
        password: '$2b$10$dummy.hash.for.testing',
        name: `${companyName} 마케팅팀`,
        type: 'BUSINESS',
        status: 'ACTIVE',
        businessProfile: {
          create: {
            companyName: companyName,
            businessNumber: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90000) + 10000}`,
            representativeName: `김대표`,
            businessAddress: `서울특별시 강남구 테헤란로 ${Math.floor(Math.random() * 500) + 1}`,
            businessCategory: category,
            isVerified: Math.random() > 0.3
          }
        }
      },
      include: {
        businessProfile: true
      }
    })
    businesses.push(business)
  }
  
  console.log(`✅ ${businesses.length}개 한국 업체 생성 완료`)
  return businesses
}

async function createKoreanInfluencers() {
  console.log('👑 한국 인플루언서 30명 생성 중...')
  const influencers = []
  
  for (let i = 0; i < 30; i++) {
    const name = KOREAN_INFLUENCER_NAMES[i % KOREAN_INFLUENCER_NAMES.length]
    const categories = [KOREAN_CATEGORIES[i % KOREAN_CATEGORIES.length]]
    
    const influencer = await prisma.user.create({
      data: {
        email: `${name.toLowerCase()}@gmail.com`,
        password: '$2b$10$dummy.hash.for.testing',
        name: name,
        type: 'INFLUENCER',
        status: 'ACTIVE',
        profile: {
          create: {
            bio: `안녕하세요! ${categories[0]} 분야 인플루언서 ${name}입니다. 트렌디하고 유용한 정보를 공유하고 있어요!`,
            profileImage: `https://images.unsplash.com/photo-${1500000000 + i}?w=400&q=80`,
            phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            instagram: `@${name.toLowerCase()}`,
            instagramFollowers: Math.floor(Math.random() * 490000) + 10000,
            youtube: `${name}채널`,
            youtubeSubscribers: Math.floor(Math.random() * 90000) + 10000,
            tiktok: `@${name.toLowerCase()}`,
            tiktokFollowers: Math.floor(Math.random() * 190000) + 10000,
            averageEngagementRate: Math.floor(Math.random() * 70) / 10 + 1.5,
            categories: JSON.stringify(categories),
            isVerified: Math.random() > 0.4
          }
        }
      },
      include: {
        profile: true
      }
    })
    influencers.push(influencer)
  }
  
  console.log(`✅ ${influencers.length}명 한국 인플루언서 생성 완료`)
  return influencers
}

async function createKoreanCampaigns(businesses: any[]) {
  console.log('📢 한국 캠페인 30개 생성 중...')
  const campaigns = []
  
  for (let i = 0; i < 30; i++) {
    const business = businesses[i % businesses.length]
    const companyName = business.businessProfile.companyName
    const category = business.businessProfile.businessCategory
    const season = SEASONS[Math.floor(Math.random() * SEASONS.length)]
    
    const titleTemplate = KOREAN_CAMPAIGN_TITLES[Math.floor(Math.random() * KOREAN_CAMPAIGN_TITLES.length)]
    const title = titleTemplate.replace('{brand}', companyName).replace('{season}', season)
    
    const descTemplate = KOREAN_DESCRIPTIONS[Math.floor(Math.random() * KOREAN_DESCRIPTIONS.length)]
    const description = descTemplate.replace(/{brand}/g, companyName).replace(/{category}/g, category)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30))
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 60) + 7)
    
    const budget = Math.floor(Math.random() * 9000000) + 1000000 // 100만~1000만원
    const platforms = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER']
    const platform = platforms[Math.floor(Math.random() * platforms.length)]
    
    const hashtags = [
      `#${companyName}`,
      `#${category}`,
      '#인플루언서',
      '#체험단',
      '#협찬',
      '#리뷰',
      '#마케팅'
    ]
    
    const statuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const campaign = await prisma.campaign.create({
      data: {
        businessId: business.id,
        title: title,
        description: description,
        platform: platform,
        budget: budget,
        targetFollowers: Math.floor(Math.random() * 490000) + 10000,
        startDate: startDate,
        endDate: endDate,
        requirements: `${category} 관련 콘텐츠 제작 경험이 있으신 분, 팔로워와의 활발한 소통, 성실한 리뷰 작성`,
        hashtags: JSON.stringify(hashtags),
        imageUrl: `https://images.unsplash.com/photo-${1600000000 + i}?w=800&q=80`,
        status: status,
        isPaid: Math.random() > 0.7
      }
    })
    campaigns.push(campaign)
  }
  
  console.log(`✅ ${campaigns.length}개 한국 캠페인 생성 완료`)
  return campaigns
}

async function createKoreanCommunityPosts(users: any[]) {
  console.log('💬 한국 커뮤니티 게시글 생성 중...')
  const posts = []
  
  const categories = ['notice', 'tips', 'review', 'question', 'free']
  
  const postContents = [
    '인플루언서 활동을 시작하신 분들께 도움이 될 만한 정보들을 정리해봤어요.\n\n1. 꾸준한 콘텐츠 업로드가 가장 중요해요\n2. 팔로워와의 소통을 활발히 하세요\n3. 본인만의 스타일을 찾는 것이 중요합니다\n4. 협찬 제품도 정말 좋다고 생각하는 것만 소개하세요\n\n더 궁금한 점 있으시면 댓글로 물어보세요!',
    
    '캠페인 지원할 때 이런 점들 체크해보세요!\n\n✅ 브랜드 컨셉과 내 채널이 맞는지\n✅ 팔로워 수 조건 확인\n✅ 제출 기한과 요구사항 숙지\n✅ 이전 협업 포트폴리오 준비\n\n성공적인 협업을 위해서는 꼼꼼한 준비가 필수예요!',
    
    '브랜드 협업 제안서 작성 팁 공유드려요.\n\n📝 자기소개 (간단명료하게)\n📊 채널 통계 (팔로워, 참여율 등)\n🎯 타겟 오디언스 분석\n💡 콘텐츠 기획안\n📈 예상 성과 및 KPI\n\n템플릿 필요하신 분들은 댓글 남겨주세요!',
    
    '팔로워 늘리는 방법 실제 경험담 공유합니다.\n\n제가 1년간 시도해본 방법들이에요:\n- 일정한 시간에 꾸준히 포스팅\n- 트렌드에 맞는 해시태그 활용\n- 다른 크리에이터들과 적극적인 소통\n- 댓글과 DM에 성실하게 답변\n\n결과적으로 팔로워가 3배 늘었어요!',
    
    '유튜브 수익화 드디어 달성했습니다! 🎉\n\n1년 2개월 만에 구독자 1천명, 시청시간 4천시간 달성했어요.\n\n노하우 정리:\n1. 썸네일의 중요성 (클릭률 2배 차이)\n2. 제목 키워드 최적화\n3. 댓글 관리와 커뮤니티 활용\n4. 업로드 일정 지키기\n\n궁금한 점 있으시면 언제든 물어보세요!'
  ]
  
  for (let i = 0; i < 30; i++) {
    const author = users[Math.floor(Math.random() * users.length)]
    const title = COMMUNITY_TITLES[i % COMMUNITY_TITLES.length]
    const content = postContents[i % postContents.length]
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    const post = await prisma.post.create({
      data: {
        title: title,
        content: content,
        authorId: author.id,
        category: category,
        status: 'PUBLISHED',
        views: Math.floor(Math.random() * 500) + 50,
        likes: Math.floor(Math.random() * 100) + 5,
        isPinned: Math.random() > 0.9
      }
    })
    posts.push(post)
  }
  
  console.log(`✅ ${posts.length}개 한국 커뮤니티 게시글 생성 완료`)
  return posts
}

async function createSampleApplications(campaigns: any[], influencers: any[]) {
  console.log('📝 캠페인 지원서 생성 중...')
  const applications = []
  
  for (const campaign of campaigns) {
    const numApplications = Math.floor(Math.random() * 4) + 2 // 2-5개
    const selectedInfluencers = influencers
      .sort(() => 0.5 - Math.random())
      .slice(0, numApplications)
    
    for (const influencer of selectedInfluencers) {
      const application = await prisma.campaignApplication.create({
        data: {
          campaignId: campaign.id,
          influencerId: influencer.id,
          message: `안녕하세요! ${influencer.name}입니다. 해당 캠페인에 많은 관심이 있어 지원하게 되었습니다. 성실하게 참여하겠습니다.`,
          proposedPrice: Math.floor(Math.random() * 1900000) + 100000,
          status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)],
          reviewedAt: Math.random() > 0.4 ? new Date() : null
        }
      })
      applications.push(application)
    }
  }
  
  console.log(`✅ ${applications.length}개 지원서 생성 완료`)
  return applications
}

async function main() {
  console.log('🚀 한글 데이터로 교체 시작...')
  
  try {
    // 1. 기존 데이터 삭제
    await clearExistingData()
    
    // 2. 관리자 계정 생성
    const admin = await createAdminUser()
    
    // 3. 한국 업체 생성
    const businesses = await createKoreanBusinessUsers()
    
    // 4. 한국 인플루언서 생성
    const influencers = await createKoreanInfluencers()
    
    // 5. 한국 캠페인 생성
    const campaigns = await createKoreanCampaigns(businesses)
    
    // 6. 캠페인 지원서 생성
    const applications = await createSampleApplications(campaigns, influencers)
    
    // 7. 한국 커뮤니티 게시글 생성
    const allUsers = [...businesses, ...influencers]
    const posts = await createKoreanCommunityPosts(allUsers)
    
    console.log('\n🎉 한글 데이터 교체 완료!')
    console.log(`📊 생성된 데이터:`)
    console.log(`   - 관리자: 1명`)
    console.log(`   - 업체: ${businesses.length}개`)
    console.log(`   - 인플루언서: ${influencers.length}명`)
    console.log(`   - 캠페인: ${campaigns.length}개`)
    console.log(`   - 지원서: ${applications.length}개`)
    console.log(`   - 커뮤니티 게시글: ${posts.length}개`)
    
  } catch (error) {
    console.error('❌ 한글 데이터 교체 실패:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { main as replaceWithKoreanData }