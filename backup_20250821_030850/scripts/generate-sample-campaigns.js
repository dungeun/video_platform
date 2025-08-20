const fs = require('fs').promises;
const path = require('path');

// 샘플 캠페인 데이터 생성
async function generateSampleCampaigns() {
  const categories = ['뷰티', '패션', '식품', '생활용품', '전자제품'];
  const platforms = ['인스타그램', '유튜브', '블로그', '틱톡'];
  const brands = [
    '네이처리퍼블릭', '이니스프리', '올리브영', '미샤', '토니모리',
    '닥터자르트', '설화수', '후', '랑콤', '샤넬',
    '나이키', '아디다스', '유니클로', '자라', 'H&M',
    '삼성', 'LG', '애플', '다이슨', '필립스',
    'CU', 'GS25', '세븐일레븐', '이마트24', '미니스톱'
  ];
  
  const productNames = [
    '수분 에센스', '선크림', '클렌징폼', '토너패드', '앰플',
    '운동화', '후드티', '청바지', '가디건', '원피스',
    '프로틴바', '비타민', '콜라겐', '유산균', '다이어트 보조제',
    '공기청정기', '무선이어폰', '스마트워치', '블루투스 스피커', '보조배터리'
  ];

  const campaigns = [];
  
  // 50개의 샘플 캠페인 생성
  for (let i = 1; i <= 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const product = productNames[Math.floor(Math.random() * productNames.length)];
    
    // 날짜 생성
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 7);
    const announceDate = new Date(endDate);
    announceDate.setDate(announceDate.getDate() + 3);
    
    const campaign = {
      id: i,
      url: `https://www.revu.net/campaign/${1188560 + i}`,
      thumbnail: `https://picsum.photos/seed/${i}/400/300`,
      title: `[${brand}] ${product} ${platform} 체험단 모집`,
      brand: brand,
      category: category,
      platform: platform,
      description: `안녕하세요, ${brand}입니다.

${brand}의 신제품 '${product}'을 체험하고 솔직한 리뷰를 작성해주실 ${platform} 인플루언서를 모집합니다.

📌 제품 소개
- ${product}는 ${category} 카테고리의 혁신적인 제품입니다.
- 특별한 성분과 기술력으로 만들어진 프리미엄 제품입니다.
- 많은 분들께 사랑받고 있는 ${brand}의 베스트셀러입니다.

✨ 체험단 미션
1. 제품을 직접 사용해보고 솔직한 후기 작성
2. 제품의 장점과 사용감을 상세히 소개
3. 실사용 사진 3장 이상 포함
4. 해시태그 필수 포함: #${brand} #${product.replace(/\s/g, '')} #체험단

💝 제공 혜택
- ${product} 정품 1개 (정가 ${(Math.floor(Math.random() * 50) + 10) * 1000}원)
- 우수 리뷰어 추가 혜택 제공
- ${brand} 신제품 우선 체험 기회`,
      images: [
        `https://picsum.photos/seed/${i}1/800/600`,
        `https://picsum.photos/seed/${i}2/800/600`,
        `https://picsum.photos/seed/${i}3/800/600`
      ],
      info: {
        participants: `모집인원: ${Math.floor(Math.random() * 20) + 10}명`,
        period: `신청기간: ${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`,
        announcement: `발표일: ${announceDate.toLocaleDateString('ko-KR')}`,
        category: `카테고리: ${category}`,
        platform: `플랫폼: ${platform}`,
        mission: `미션: 제품 사용 후 ${platform}에 상세 리뷰 작성`
      },
      requirements: {
        followers: Math.floor(Math.random() * 5000) + 1000,
        engagementRate: (Math.random() * 5 + 1).toFixed(1),
        contentQuality: '높음'
      },
      provides: [
        `${product} 정품 1개`,
        '무료 배송',
        '체험 가이드 제공',
        '우수 리뷰어 추가 혜택'
      ],
      status: i % 3 === 0 ? 'CLOSED' : 'ACTIVE',
      applicants: Math.floor(Math.random() * 100) + 50,
      viewCount: Math.floor(Math.random() * 1000) + 500,
      crawledAt: new Date().toISOString()
    };
    
    campaigns.push(campaign);
  }
  
  // 이미지 폴더 생성
  const imageDir = path.join(__dirname, '../public/crawled-images');
  await fs.mkdir(imageDir, { recursive: true });
  
  // 샘플 이미지 다운로드 (첫 5개만)
  console.log('샘플 이미지 다운로드 중...');
  for (let i = 0; i < 5; i++) {
    const campaign = campaigns[i];
    
    // 로컬 경로로 변경
    campaign.thumbnail = `/images/sample/campaign_${i + 1}_thumb.jpg`;
    campaign.images = campaign.images.map((img, idx) => 
      `/images/sample/campaign_${i + 1}_image_${idx + 1}.jpg`
    );
  }
  
  // JSON 파일로 저장
  const outputPath = path.join(__dirname, '../public/crawled-campaigns.json');
  await fs.writeFile(outputPath, JSON.stringify(campaigns, null, 2));
  
  console.log(`✅ ${campaigns.length}개의 샘플 캠페인 데이터 생성 완료!`);
  console.log(`📁 저장 위치: ${outputPath}`);
  
  // 요약 정보
  console.log('\n📊 생성된 캠페인 요약:');
  console.log(`- 총 캠페인 수: ${campaigns.length}`);
  console.log(`- 활성 캠페인: ${campaigns.filter(c => c.status === 'ACTIVE').length}`);
  console.log(`- 마감 캠페인: ${campaigns.filter(c => c.status === 'CLOSED').length}`);
  console.log(`- 카테고리: ${categories.join(', ')}`);
  console.log(`- 플랫폼: ${platforms.join(', ')}`);
  
  return campaigns;
}

// 데이터베이스 시드 데이터 생성
async function generateSeedData() {
  const campaigns = await generateSampleCampaigns();
  
  // Prisma seed 형식으로 변환
  const seedData = campaigns.map((campaign, index) => ({
    title: campaign.title,
    description: campaign.description,
    platform: campaign.platform.toUpperCase(),
    budget: (Math.floor(Math.random() * 500) + 100) * 10000,
    targetFollowers: campaign.requirements.followers,
    startDate: new Date(campaign.info.period.split(' ~ ')[0].replace('신청기간: ', '')),
    endDate: new Date(campaign.info.period.split(' ~ ')[1]),
    requirements: campaign.provides.join('\n'),
    hashtags: `#${campaign.brand} #${campaign.title.split(' ')[1]}`,
    imageUrl: campaign.thumbnail,
    status: campaign.status === 'ACTIVE' ? 'APPROVED' : 'COMPLETED',
    category: campaign.category,
    maxApplicants: parseInt(campaign.info.participants.replace(/[^0-9]/g, '')),
    viewCount: campaign.viewCount
  }));
  
  const seedPath = path.join(__dirname, '../prisma/seed-campaigns.json');
  await fs.writeFile(seedPath, JSON.stringify(seedData, null, 2));
  
  console.log(`\n📁 Seed 데이터 저장: ${seedPath}`);
}

// 실행
if (require.main === module) {
  generateSampleCampaigns()
    .then(() => generateSeedData())
    .then(() => {
      console.log('\n✅ 모든 작업 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { generateSampleCampaigns };