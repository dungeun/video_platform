import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// 캠페인별 이미지 URL 배열
const campaignImages = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80', // 화장품
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80', // 뷰티
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', // 스킨케어
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80', // 메이크업
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', // 코스메틱
  'https://images.unsplash.com/photo-1567721913486-6585f069b332?w=800&q=80', // 향수
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80', // 스포츠 신발
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80', // 의류
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', // 패션
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80', // 옷
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80', // 스마트워치
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', // 시계
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // 음식
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80', // 푸드
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // 요리
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // 맛집
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', // 여행
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80', // 여행지
  'https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800&q=80', // 테크
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80', // 전자제품
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80', // 노트북
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', // 맥북
  'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80', // 아이폰
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', // 가방
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', // 선글라스
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', // 운동화
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', // 핸드폰
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80', // 카메라
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', // 헤드폰
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'  // 커피
]

async function updateCampaignImages() {
  console.log('🚀 캠페인 이미지 업데이트 시작...')
  
  try {
    // 모든 캠페인 조회
    const campaigns = await prisma.campaigns.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📋 총 ${campaigns.length}개의 캠페인을 찾았습니다.`)
    
    let updatedCount = 0
    
    // 각 캠페인에 이미지 URL 할당
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i]
      
      // 이미 올바른 이미지 URL이 있는 경우 건너뛰기
      if (campaign.imageUrl && 
          !campaign.imageUrl.startsWith('data:') && 
          !campaign.imageUrl.startsWith('/images/') &&
          campaign.imageUrl.startsWith('http')) {
        console.log(`✅ ${campaign.title} - 이미 이미지가 있음`)
        continue
      }
      
      // 이미지 배열에서 순환하여 할당
      const imageUrl = campaignImages[i % campaignImages.length]
      
      await prisma.campaigns.update({
        where: { id: campaign.id },
        data: { imageUrl }
      })
      
      updatedCount++
      console.log(`✅ ${campaign.title} - 이미지 업데이트 완료`)
    }
    
    console.log(`\n🎉 완료! ${updatedCount}개의 캠페인 이미지를 업데이트했습니다.`)
    
  } catch (error) {
    console.error('❌ 캠페인 이미지 업데이트 실패:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
updateCampaignImages()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { updateCampaignImages }