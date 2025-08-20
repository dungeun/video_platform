const fs = require('fs');
const path = require('path');

function updateCampaignImages() {
  console.log('📝 캠페인 이미지 경로 업데이트 중...\n');
  
  // JSON 파일 읽기
  const campaignsPath = path.join(__dirname, '../public/crawled-campaigns.json');
  const campaigns = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
  
  // 각 캠페인의 이미지 경로 업데이트
  campaigns.forEach((campaign, index) => {
    const campaignId = index + 1;
    
    // 기존 images 배열 삭제
    delete campaign.images;
    
    // 2개의 이미지 경로 설정
    campaign.thumbnail = `/images/campaigns/campaign_${campaignId}_thumb.jpg`;
    campaign.detailImage = `/images/campaigns/campaign_${campaignId}_detail.jpg`;
    
    console.log(`✓ 캠페인 ${campaignId}: ${campaign.title}`);
    console.log(`  - 썸네일: ${campaign.thumbnail}`);
    console.log(`  - 상세이미지: ${campaign.detailImage}\n`);
  });
  
  // 업데이트된 내용 저장
  fs.writeFileSync(campaignsPath, JSON.stringify(campaigns, null, 2));
  
  console.log('✅ 업데이트 완료!');
  console.log(`📁 파일: ${campaignsPath}`);
  console.log(`📊 총 ${campaigns.length}개 캠페인 업데이트됨`);
  
  // 실제 이미지 파일 확인
  const imageDir = path.join(__dirname, '../public/images/campaigns');
  let thumbCount = 0;
  let detailCount = 0;
  
  for (let i = 1; i <= campaigns.length; i++) {
    const thumbPath = path.join(imageDir, `campaign_${i}_thumb.jpg`);
    const detailPath = path.join(imageDir, `campaign_${i}_detail.jpg`);
    
    if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 0) thumbCount++;
    if (fs.existsSync(detailPath) && fs.statSync(detailPath).size > 0) detailCount++;
  }
  
  console.log('\n📸 실제 이미지 파일 현황:');
  console.log(`- 썸네일: ${thumbCount}/${campaigns.length}개`);
  console.log(`- 상세이미지: ${detailCount}/${campaigns.length}개`);
}

// 실행
updateCampaignImages();