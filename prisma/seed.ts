import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시딩 시작...');

  // 1. 관리자 계정 생성
  const adminPassword = await bcrypt.hash('admin123!@#', 10);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@videopick.com' },
    update: {},
    create: {
      id: 'admin-001',
      email: 'admin@videopick.com',
      password: adminPassword,
      name: '시스템 관리자',
      type: 'ADMIN',
      status: 'ACTIVE',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 관리자 계정 생성:', admin.email);

  // 2. 비즈니스 계정 생성
  const businessPassword = await bcrypt.hash('business123!', 10);
  const businessUsers = await Promise.all([
    prisma.users.upsert({
      where: { email: 'samsung@example.com' },
      update: {},
      create: {
        id: 'business-001',
        email: 'samsung@example.com',
        password: businessPassword,
        name: '삼성전자',
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.users.upsert({
      where: { email: 'lg@example.com' },
      update: {},
      create: {
        id: 'business-002',
        email: 'lg@example.com',
        password: businessPassword,
        name: 'LG전자',
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ 비즈니스 계정 생성:', businessUsers.length);

  // 3. 비즈니스 프로필 생성
  await Promise.all(
    businessUsers.map((user, index) =>
      prisma.business_profiles.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          id: `business-profile-${index + 1}`,
          userId: user.id,
          companyName: user.name,
          businessNumber: `123-45-${67890 + index}`,
          representativeName: `대표이사 ${index + 1}`,
          businessAddress: `서울시 강남구 테헤란로 ${100 + index}`,
          businessCategory: '전자제품',
          isVerified: true,
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  );
  console.log('✅ 비즈니스 프로필 생성 완료');

  // 4. 크리에이터 계정 생성
  const creatorPassword = await bcrypt.hash('creator123!', 10);
  const creators = await Promise.all([
    prisma.users.upsert({
      where: { email: 'creator1@example.com' },
      update: {},
      create: {
        id: 'creator-001',
        email: 'creator1@example.com',
        password: creatorPassword,
        name: '김유튜버',
        type: 'CREATOR',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.users.upsert({
      where: { email: 'creator2@example.com' },
      update: {},
      create: {
        id: 'creator-002',
        email: 'creator2@example.com',
        password: creatorPassword,
        name: '이틱톡커',
        type: 'CREATOR',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.users.upsert({
      where: { email: 'creator3@example.com' },
      update: {},
      create: {
        id: 'creator-003',
        email: 'creator3@example.com',
        password: creatorPassword,
        name: '박인스타',
        type: 'CREATOR',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ 크리에이터 계정 생성:', creators.length);

  // 5. 크리에이터 채널 생성
  await Promise.all(
    creators.map((creator, index) =>
      prisma.channels.upsert({
        where: { userId: creator.id },
        update: {},
        create: {
          id: `channel-${index + 1}`,
          userId: creator.id,
          name: creator.name,
          handle: `@${creator.name.replace(/\s/g, '').toLowerCase()}`,
          description: `${creator.name}의 공식 채널입니다.`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`,
          bannerUrl: `https://picsum.photos/1920/480?random=${index}`,
          isVerified: true,
          subscriberCount: Math.floor(Math.random() * 1000000) + 10000,
          videoCount: Math.floor(Math.random() * 500) + 50,
          totalViews: BigInt(Math.floor(Math.random() * 100000000) + 1000000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  );
  console.log('✅ 크리에이터 채널 생성 완료');

  // 6. 크리에이터 프로필 생성
  await Promise.all(
    creators.map((creator, index) =>
      prisma.profiles.upsert({
        where: { userId: creator.id },
        update: {},
        create: {
          id: `profile-${index + 1}`,
          userId: creator.id,
          bio: `안녕하세요! ${creator.name}입니다. 다양한 콘텐츠로 소통해요!`,
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`,
          phone: `010-${1234 + index}-5678`,
          instagram: `@${creator.name.replace(/\s/g, '').toLowerCase()}`,
          instagramFollowers: Math.floor(Math.random() * 100000) + 1000,
          youtube: `youtube.com/@${creator.name.replace(/\s/g, '').toLowerCase()}`,
          youtubeSubscribers: Math.floor(Math.random() * 1000000) + 10000,
          categories: '라이프스타일,뷰티,테크',
          isVerified: true,
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  );
  console.log('✅ 크리에이터 프로필 생성 완료');

  // 7. 인플루언서 계정 생성
  const influencerPassword = await bcrypt.hash('influencer123!', 10);
  const influencers = await Promise.all([
    prisma.users.upsert({
      where: { email: 'influencer1@example.com' },
      update: {},
      create: {
        id: 'influencer-001',
        email: 'influencer1@example.com',
        password: influencerPassword,
        name: '최인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.users.upsert({
      where: { email: 'influencer2@example.com' },
      update: {},
      create: {
        id: 'influencer-002',
        email: 'influencer2@example.com',
        password: influencerPassword,
        name: '정마이크로인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ 인플루언서 계정 생성:', influencers.length);

  // 8. 일반 시청자 계정 생성
  const viewerPassword = await bcrypt.hash('viewer123!', 10);
  const viewers = await Promise.all([
    prisma.users.upsert({
      where: { email: 'viewer1@example.com' },
      update: {},
      create: {
        id: 'viewer-001',
        email: 'viewer1@example.com',
        password: viewerPassword,
        name: '홍길동',
        type: 'VIEWER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.users.upsert({
      where: { email: 'viewer2@example.com' },
      update: {},
      create: {
        id: 'viewer-002',
        email: 'viewer2@example.com',
        password: viewerPassword,
        name: '김철수',
        type: 'VIEWER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);
  console.log('✅ 시청자 계정 생성:', viewers.length);

  // 9. 샘플 캠페인 생성
  const campaigns = await Promise.all(
    businessUsers.map((business, index) =>
      prisma.campaigns.create({
        data: {
          id: `campaign-${index + 1}`,
          businessId: business.id,
          title: `${business.name} 신제품 런칭 캠페인`,
          description: `${business.name}의 혁신적인 신제품을 소개합니다!`,
          platform: 'YOUTUBE',
          budget: 5000000 + index * 1000000,
          targetFollowers: 10000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          requirements: '제품 리뷰 영상 제작 및 업로드',
          hashtags: '#신제품 #리뷰 #테크',
          status: 'ACTIVE',
          isPaid: true,
          location: '전국',
          maxApplicants: 50,
          rewardAmount: 500000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  );
  console.log('✅ 샘플 캠페인 생성:', campaigns.length);

  console.log('🎉 시딩 완료!');
  console.log('\n📋 생성된 계정 정보:');
  console.log('----------------------------------------');
  console.log('관리자: admin@videopick.com / admin123!@#');
  console.log('비즈니스: samsung@example.com / business123!');
  console.log('비즈니스: lg@example.com / business123!');
  console.log('크리에이터: creator1@example.com / creator123!');
  console.log('크리에이터: creator2@example.com / creator123!');
  console.log('크리에이터: creator3@example.com / creator123!');
  console.log('인플루언서: influencer1@example.com / influencer123!');
  console.log('인플루언서: influencer2@example.com / influencer123!');
  console.log('시청자: viewer1@example.com / viewer123!');
  console.log('시청자: viewer2@example.com / viewer123!');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('시딩 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });