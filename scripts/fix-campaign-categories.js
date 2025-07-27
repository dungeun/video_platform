const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 브랜드명 기반 카테고리 매핑
const brandCategoryMap = {
  // 패션
  '유니클로': '패션',
  '자라': '패션',
  'H&M': '패션',
  '나이키': '패션',
  '아디다스': '패션',
  
  // 뷰티
  '닥터자르트': '뷰티',
  '샤넬': '뷰티',
  '이니스프리': '뷰티',
  '에뛰드': '뷰티',
  '올리브영': '뷰티',
  
  // 음식/푸드
  'CU': '음식',
  'GS25': '음식',
  '이마트24': '음식',
  '세븐일레븐': '음식',
  '미니스톱': '음식',
  '스타벅스': '음식',
  '맥도날드': '음식',
  
  // 기술/테크
  '애플': '기술',
  '삼성': '기술',
  'LG': '기술',
  '다이슨': '기술',
  
  // 기타
  '롯데': '라이프스타일'
};

// 제품명 기반 카테고리 추론
function inferCategoryFromProduct(title) {
  const lowerTitle = title.toLowerCase();
  
  // 뷰티 관련 키워드
  if (lowerTitle.includes('화장품') || lowerTitle.includes('에센스') || 
      lowerTitle.includes('앰플') || lowerTitle.includes('콜라겐') ||
      lowerTitle.includes('비타민') || lowerTitle.includes('스킨케어')) {
    return '뷰티';
  }
  
  // 패션 관련 키워드
  if (lowerTitle.includes('원피스') || lowerTitle.includes('운동화') || 
      lowerTitle.includes('가방') || lowerTitle.includes('신발') ||
      lowerTitle.includes('옷') || lowerTitle.includes('의류')) {
    return '패션';
  }
  
  // 음식 관련 키워드
  if (lowerTitle.includes('프로틴바') || lowerTitle.includes('음료') || 
      lowerTitle.includes('커피') || lowerTitle.includes('식품') ||
      lowerTitle.includes('간식') || lowerTitle.includes('도시락')) {
    return '음식';
  }
  
  // 기술 관련 키워드
  if (lowerTitle.includes('전자제품') || lowerTitle.includes('스마트') || 
      lowerTitle.includes('가전') || lowerTitle.includes('디지털')) {
    return '기술';
  }
  
  return null;
}

async function fixCategories() {
  try {
    // 여러 비즈니스 계정 생성
    const businessAccounts = [
      { email: 'fashion@example.com', name: '패션사업부', category: '패션' },
      { email: 'beauty@example.com', name: '뷰티사업부', category: '뷰티' },
      { email: 'food@example.com', name: '식품사업부', category: '음식' },
      { email: 'tech@example.com', name: '기술사업부', category: '기술' },
      { email: 'lifestyle@example.com', name: '라이프스타일사업부', category: '라이프스타일' }
    ];

    // 비즈니스 계정 생성 또는 업데이트
    const businessUsers = {};
    for (const account of businessAccounts) {
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {},
        create: {
          email: account.email,
          password: '$2a$10$k8Y5M6MzN5pYvnOuC1CgOuQr9HT5H5J0c5yGzZQcE5RqBQKxpUJPm', // password123
          name: account.name,
          type: 'BUSINESS',
          businessProfile: {
            create: {
              companyName: account.name,
              businessNumber: '123-45-67890',
              businessCategory: account.category,
              representativeName: '대표자',
              businessAddress: '서울특별시 강남구 테헤란로 123'
            }
          }
        },
        include: {
          businessProfile: true
        }
      });
      businessUsers[account.category] = user.id;
    }

    // 모든 캠페인 가져오기
    const campaigns = await prisma.campaign.findMany();
    
    console.log(`총 ${campaigns.length}개의 캠페인을 업데이트합니다...`);
    
    let categoryCount = {};
    
    for (const campaign of campaigns) {
      // 브랜드명 추출 (대괄호 안의 내용)
      const brandMatch = campaign.title.match(/\[(.*?)\]/);
      const brandName = brandMatch ? brandMatch[1] : null;
      
      // 카테고리 결정
      let category = null;
      
      // 1. 브랜드명으로 카테고리 찾기
      if (brandName && brandCategoryMap[brandName]) {
        category = brandCategoryMap[brandName];
      }
      
      // 2. 제품명으로 카테고리 추론
      if (!category) {
        category = inferCategoryFromProduct(campaign.title);
      }
      
      // 3. 기본값
      if (!category) {
        category = '라이프스타일';
      }
      
      // 해당 카테고리의 비즈니스 계정으로 캠페인 이동
      if (businessUsers[category]) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { businessId: businessUsers[category] }
        });
        
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        console.log(`캠페인 "${campaign.title}" -> ${category}`);
      }
    }
    
    console.log('\n=== 업데이트 결과 ===');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`${category}: ${count}개`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategories();