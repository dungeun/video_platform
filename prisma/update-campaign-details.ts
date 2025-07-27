import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCampaignDetails() {
  try {
    console.log('캠페인 상세 정보 업데이트 시작...');

    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      include: {
        business: {
          include: {
            businessProfile: true
          }
        }
      }
    });

    console.log(`총 ${campaigns.length}개의 캠페인을 업데이트합니다.`);

    for (const campaign of campaigns) {
      const category = campaign.business.businessProfile?.businessCategory || '일반';
      
      // 카테고리별 상품 정보
      const productData = getProductDataByCategory(category);
      
      const updateData = {
        // 상세 요구사항
        detailedRequirements: JSON.stringify([
          `${category} 콘텐츠 제작 경험 1년 이상`,
          `${campaign.platform} 팔로워 ${campaign.targetFollowers.toLocaleString()}명 이상`,
          '평균 참여율 3% 이상',
          '월 4회 이상 콘텐츠 업로드 가능',
          '긍정적이고 진정성 있는 리뷰 작성 가능',
          `${category} 분야에 대한 전문적인 지식 보유`
        ]),
        
        // 제작 콘텐츠
        deliverables: JSON.stringify([
          `${campaign.platform} 피드 포스트 3개`,
          `${campaign.platform} 스토리 5개`,
          '제품 사용 리뷰 콘텐츠',
          '제품 사용 전/후 비교 콘텐츠',
          '하이라이트 영상 1개 (30초 이상)'
        ]),
        
        // 상품 소개
        productIntro: productData.intro,
        
        // 상품 이미지
        productImages: JSON.stringify(productData.images),
        
        // 기타 필드
        maxApplicants: 50 + Math.floor(Math.random() * 50),
        viewCount: Math.floor(Math.random() * 1000) + 100,
        location: '전국'
      };

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: updateData
      });

      console.log(`✓ ${campaign.title} 캠페인 업데이트 완료`);
    }

    console.log('모든 캠페인 업데이트 완료!');
  } catch (error) {
    console.error('캠페인 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getProductDataByCategory(category: string) {
  const categoryData: Record<string, { intro: string; images: string[] }> = {
    '뷰티': {
      intro: `이 제품은 최고급 원료만을 사용하여 제작된 프리미엄 뷰티 제품입니다.

주요 특징:
• 100% 천연 성분 사용
• 피부 테스트 완료
• 친환경 패키지
• 지속 가능한 생산 방식
• 민감성 피부에도 안전

제품 사용법:
1. 세안 후 토너로 피부를 정돈합니다
2. 적당량을 손에 덜어 얼굴 전체에 부드럽게 펴 발라줍니다
3. 가볍게 두드려 흡수시켜 줍니다
4. 아침, 저녁으로 사용하시면 더욱 효과적입니다`,
      images: [
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'
      ]
    },
    '패션': {
      intro: `트렌디하고 스타일리시한 패션 아이템으로 당신의 일상을 특별하게 만들어보세요.

주요 특징:
• 프리미엄 소재 사용
• 편안한 착용감
• 다양한 스타일링 가능
• 사계절 활용 가능
• 친환경 생산 공정

스타일링 팁:
1. 캐주얼한 데일리룩에 포인트로 활용
2. 오피스룩과 매치하여 세련된 분위기 연출
3. 주말 나들이에 편안하게 착용
4. 다양한 액세서리와 함께 레이어드`,
      images: [
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80'
      ]
    },
    '푸드': {
      intro: `건강하고 맛있는 프리미엄 식품으로 일상에 활력을 더하세요.

주요 특징:
• 엄선된 원재료 사용
• 무첨가물, 무방부제
• HACCP 인증 시설에서 생산
• 영양소 보존 특수 포장
• 간편한 조리 방법

제품 활용법:
1. 아침 식사 대용으로 간편하게
2. 운동 전후 에너지 보충용
3. 바쁜 일상 속 건강한 간식
4. 가족과 함께 즐기는 특별한 한 끼`,
      images: [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'
      ]
    },
    '라이프스타일': {
      intro: `일상을 더욱 풍요롭게 만들어주는 라이프스타일 제품입니다.

주요 특징:
• 실용적이고 세련된 디자인
• 높은 내구성과 품질
• 다양한 활용도
• 공간 효율적인 설계
• 환경 친화적 소재

사용 가이드:
1. 일상 생활에서 편리하게 활용
2. 인테리어 소품으로도 활용 가능
3. 선물용으로도 적합
4. 오래 사용할 수 있는 지속가능한 제품`,
      images: [
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80'
      ]
    }
  };

  // 기본값
  const defaultData = {
    intro: `우수한 품질의 제품으로 고객님께 특별한 가치를 제공합니다.

주요 특징:
• 엄격한 품질 관리
• 합리적인 가격
• 뛰어난 성능
• 고객 만족 보장
• 빠른 배송 서비스

제품 안내:
1. 제품 특성에 맞게 사용해주세요
2. 사용 전 설명서를 꼭 읽어주세요
3. 고객센터를 통해 문의 가능합니다
4. 만족스러운 사용 경험을 약속드립니다`,
    images: [
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'
    ]
  };

  return categoryData[category] || defaultData;
}

// 스크립트 실행
updateCampaignDetails()
  .catch(console.error);