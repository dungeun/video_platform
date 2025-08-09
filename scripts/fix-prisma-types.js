#!/usr/bin/env node

/**
 * Prisma 타입 에러 수정 스크립트
 * snake_case 모델명을 올바른 형식으로 변경
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 변경할 매핑
const modelMappings = {
  // 복수형 's' 제거 (잘못된 복수형)
  '.userss': '.users',
  '.profiless': '.profiles',
  '.campaignss': '.campaigns',
  '.paymentss': '.payments',
  '.settlementss': '.settlements',
  '.notificationss': '.notifications',
  '.followss': '.follows',
  '.filess': '.files',
  '.postss': '.posts',
  '.commentss': '.comments',
  '.contentss': '.contents',
  '.refundss': '.refunds',
  
  // camelCase -> snake_case
  '.businessProfile': '.business_profiles',
  '.campaignApplication': '.campaign_applications',
  '.campaignsApplication': '.campaign_applications',
  '.postLike': '.post_likes',
  '.postsLike': '.post_likes',
  '.contentMedia': '.content_media',
  '.contentsMedia': '.content_media',
  '.settlementItem': '.settlement_items',
  '.settlementsItem': '.settlement_items',
  '.campaignLike': '.campaign_likes',
  '.campaignsLike': '.campaign_likes',
  '.applicationTemplate': '.application_templates',
  '.campaignTemplate': '.campaign_templates',
  '.siteConfig': '.site_config',
};

const files = [
  'prisma/add-admin-users.ts',
  'prisma/clear-and-seed-korean.ts',
  'prisma/seed-sample-data.ts',
  'prisma/seed-real-accounts.ts',
  'prisma/seed.ts',
  'prisma/verify-data.ts',
  'prisma/update-campaign-details.ts',
  'prisma/update-campaign-images.ts',
];

let totalReplacements = 0;

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let replacements = 0;
  
  // 각 매핑에 대해 교체
  Object.entries(modelMappings).forEach(([oldPattern, newPattern]) => {
    const regex = new RegExp(`prisma${oldPattern.replace('.', '\\.')}(?![a-zA-Z])`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, `prisma${newPattern}`);
      replacements += matches.length;
    }
  });
  
  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${replacements}개 수정됨`);
    totalReplacements += replacements;
  }
});

console.log(`\n🎉 총 ${totalReplacements}개의 Prisma 타입 에러가 수정되었습니다!`);