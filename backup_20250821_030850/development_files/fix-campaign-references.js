#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 수정할 파일 목록 (API 라우트 위주)
const filesToFix = [
  '/Users/admin/new_project/video_platform/src/app/api/campaigns/[id]/apply/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/test-db/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/videos/upload/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/reports/[id]/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/analytics/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/setup/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/health/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/home/statistics/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/videos/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/search/suggestions/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/video-stats/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/videos/[id]/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/campaigns/[id]/fee-rate/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/campaigns/[id]/status/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/campaigns/[id]/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/campaigns/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/campaigns/[id]/publish/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/payments/direct/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/campaigns/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/campaigns/[id]/payment-status/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/payments/test-complete/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/payments/callback/fail/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/payments/callback/success/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/payments/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/campaigns/[id]/like/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/campaigns/[id]/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/admin/payments/[id]/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/influencer/applications/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/campaigns/[id]/applications/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/campaigns/[id]/save/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/applications/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/campaigns/[id]/applications/route.ts',
  '/Users/admin/new_project/video_platform/src/app/api/business/campaigns/[id]/delete/route.ts',
  '/Users/admin/new_project/video_platform/src/lib/db/query-utils.ts'
];

let totalFiles = 0;
let totalReplacements = 0;

console.log('🚀 Fixing prisma.campaign references...');

for (const filePath of filesToFix) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all instances of prisma.campaign. with prisma.campaigns.
    const updatedContent = content.replace(/prisma\.campaign\./g, 'prisma.campaigns.');
    
    if (updatedContent !== originalContent) {
      const matches = (originalContent.match(/prisma\.campaign\./g) || []).length;
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Fixed ${matches} references in ${path.basename(filePath)}`);
      totalFiles++;
      totalReplacements += matches;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n🎉 Completed! Fixed ${totalReplacements} references in ${totalFiles} files.`);