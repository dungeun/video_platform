const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!@#', 10)
  const admin = await prisma.users.upsert({
    where: { email: 'admin@linkpick.co.kr' },
    update: {},
    create: {
      email: 'admin@linkpick.co.kr',
      password: adminPassword,
      name: 'LinkPick Admin',
      type: 'ADMIN',
      verified: true,
    }
  })
  console.log('✅ Admin user created:', admin.email)

  // Create test business user
  const businessPassword = await bcrypt.hash('business123!', 10)
  const businessUser = await prisma.users.upsert({
    where: { email: 'business@company.com' },
    update: {},
    create: {
      email: 'business@company.com',
      password: businessPassword,
      name: '테스트 기업',
      type: 'BUSINESS',
      verified: true,
      businessProfile: {
        create: {
          companyName: '테스트 주식회사',
          businessNumber: '123-45-67890',
          representativeName: '김대표',
          businessAddress: '서울특별시 강남구 테헤란로 123',
          businessCategory: '이커머스',
          isVerified: true,
        }
      }
    }
  })
  console.log('✅ Business user created:', businessUser.email)

  // Create test influencer user
  const influencerPassword = await bcrypt.hash('influencer123!', 10)
  const influencerUser = await prisma.users.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: influencerPassword,
      name: '테스트 인플루언서',
      type: 'INFLUENCER',
      verified: true,
      profile: {
        create: {
          bio: '패션과 라이프스타일을 공유하는 인플루언서입니다.',
          instagram: '@test_influencer',
          instagramFollowers: 50000,
          youtube: 'TestInfluencer',
          youtubeSubscribers: 30000,
          categories: JSON.stringify(['패션', '라이프스타일']),
          isVerified: true,
        }
      }
    }
  })
  console.log('✅ Influencer user created:', influencerUser.email)

  // Create sample campaign
  const campaign = await prisma.campaigns.create({
    data: {
      businessId: businessUser.id,
      title: 'LinkPick 런칭 기념 캠페인',
      description: 'LinkPick 플랫폼 런칭을 기념하는 특별 캠페인입니다. 다양한 카테고리의 인플루언서를 모집합니다.',
      platform: 'INSTAGRAM',
      budget: 5000000,
      targetFollowers: 10000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      requirements: '- 팔로워 1만명 이상\n- 참여율 3% 이상\n- 고품질 콘텐츠 제작 가능',
      hashtags: JSON.stringify(['LinkPick', '인플루언서마케팅', '런칭이벤트']),
      status: 'ACTIVE',
      isPaid: true,
    }
  })
  console.log('✅ Sample campaign created:', campaign.title)

  // Create site configuration
  await prisma.siteConfig.upsert({
    where: { key: 'ui_config' },
    update: {},
    create: {
      key: 'ui_config',
      value: JSON.stringify({
        header: {
          menus: [
            { id: '1', label: '홈', href: '/', order: 0 },
            { id: '2', label: '캠페인', href: '/campaigns', order: 1 },
            { id: '3', label: '인플루언서', href: '/influencers', order: 2 },
            { id: '4', label: '커뮤니티', href: '/community', order: 3 },
            { id: '5', label: '요금제', href: '/pricing', order: 4 },
          ]
        },
        footer: {
          columns: [
            {
              id: '1',
              title: '서비스',
              order: 0,
              links: [
                { id: '1-1', label: '서비스 소개', href: '/about', order: 0 },
                { id: '1-2', label: '이용 가이드', href: '/guide', order: 1 },
                { id: '1-3', label: '요금제', href: '/pricing', order: 2 },
              ]
            },
            {
              id: '2',
              title: '고객지원',
              order: 1,
              links: [
                { id: '2-1', label: '공지사항', href: '/notices', order: 0 },
                { id: '2-2', label: 'FAQ', href: '/faq', order: 1 },
                { id: '2-3', label: '문의하기', href: '/contact', order: 2 },
              ]
            },
            {
              id: '3',
              title: '정책',
              order: 2,
              links: [
                { id: '3-1', label: '이용약관', href: '/terms', order: 0 },
                { id: '3-2', label: '개인정보처리방침', href: '/privacy', order: 1 },
              ]
            }
          ]
        }
      })
    }
  })
  console.log('✅ Site configuration created')

  console.log('✅ Production database seed completed!')
  console.log('\n📝 Login credentials:')
  console.log('Admin: admin@linkpick.co.kr / admin123!@#')
  console.log('Business: business@company.com / business123!')
  console.log('Influencer: user@example.com / influencer123!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })