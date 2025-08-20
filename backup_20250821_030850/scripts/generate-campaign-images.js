const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadImage(url, filepath) {
  const writer = fs.createWriteStream(filepath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      const stats = fs.statSync(filepath);
      console.log(`✓ ${path.basename(filepath)} (${(stats.size / 1024).toFixed(1)}KB)`);
      resolve();
    });
    writer.on('error', reject);
  });
}

async function generateCampaignImages() {
  console.log('🖼️  캠페인 이미지 생성 시작...\n');
  console.log('각 캠페인마다 2개의 이미지를 생성합니다:');
  console.log('1. 썸네일 이미지 (400x300) - 목록에서 표시');
  console.log('2. 상세 이미지 (600x1800) - 긴 세로 이미지\n');
  
  const imageDir = path.join(__dirname, '../public/images/campaigns');
  
  // 디렉토리 생성
  if (fs.existsSync(imageDir)) {
    fs.rmSync(imageDir, { recursive: true });
  }
  fs.mkdirSync(imageDir, { recursive: true });
  
  // 50개 캠페인의 이미지 생성
  for (let i = 1; i <= 50; i++) {
    console.log(`\n캠페인 ${i} 이미지 생성 중...`);
    
    try {
      // 1. 썸네일 이미지 (400x300)
      const thumbUrl = `https://picsum.photos/seed/revuthumb${i}/400/300`;
      const thumbPath = path.join(imageDir, `campaign_${i}_thumb.jpg`);
      await downloadImage(thumbUrl, thumbPath);
      
      // 2. 상세 페이지 긴 이미지 (600x1800)
      const detailUrl = `https://picsum.photos/seed/revudetail${i}/600/1800`;
      const detailPath = path.join(imageDir, `campaign_${i}_detail.jpg`);
      await downloadImage(detailUrl, detailPath);
      
      // 서버 부하 방지
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`✗ 캠페인 ${i} 실패:`, error.message);
    }
  }
  
  // 결과 확인
  const files = fs.readdirSync(imageDir);
  const totalSize = files.reduce((sum, file) => {
    const stats = fs.statSync(path.join(imageDir, file));
    return sum + stats.size;
  }, 0);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 이미지 생성 완료!');
  console.log('='.repeat(50));
  console.log(`📁 저장 위치: ${imageDir}`);
  console.log(`📊 생성된 파일: ${files.length}개`);
  console.log(`💾 총 용량: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log('\n📸 이미지 구성:');
  console.log('- campaign_X_thumb.jpg: 썸네일 (400x300)');
  console.log('- campaign_X_detail.jpg: 상세 이미지 (600x1800)');
  
  // crawled-campaigns.json 파일 업데이트
  const campaignsPath = path.join(__dirname, '../public/crawled-campaigns.json');
  const campaigns = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
  
  // 이미지 경로 업데이트
  campaigns.forEach((campaign, index) => {
    campaign.thumbnail = `/images/campaigns/campaign_${index + 1}_thumb.jpg`;
    campaign.detailImage = `/images/campaigns/campaign_${index + 1}_detail.jpg`;
    
    // 기존 images 배열 대신 detailImage 사용
    delete campaign.images;
  });
  
  fs.writeFileSync(campaignsPath, JSON.stringify(campaigns, null, 2));
  console.log('\n✅ crawled-campaigns.json 파일 업데이트 완료!');
}

// 실행
generateCampaignImages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('오류:', error);
    process.exit(1);
  });