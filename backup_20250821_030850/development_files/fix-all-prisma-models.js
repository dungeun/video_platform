#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 모델 매핑 정의
const modelMappings = {
  'prisma.user.': 'prisma.users.',
  'prisma.profile.': 'prisma.profiles.',
  'prisma.businessProfile.': 'prisma.business_profiles.',
  'prisma.campaign.': 'prisma.campaigns.',
  'prisma.application.': 'prisma.campaign_applications.',
  'prisma.content.': 'prisma.contents.',
  'prisma.contentMedia.': 'prisma.content_media.',
  'prisma.payment.': 'prisma.payments.',
  'prisma.settlement.': 'prisma.settlements.',
  'prisma.settlementItem.': 'prisma.settlement_items.',
  'prisma.notification.': 'prisma.notifications.',
  'prisma.file.': 'prisma.files.',
  'prisma.follow.': 'prisma.follows.',
  'prisma.post.': 'prisma.posts.',
  'prisma.comment.': 'prisma.comments.',
  'prisma.postLike.': 'prisma.post_likes.',
  'prisma.refund.': 'prisma.refunds.'
};

// 검색할 파일들 (수동으로 나열)
const filesToCheck = [
  '/Users/admin/new_project/video_platform/prisma/seed-posts.ts',
  '/Users/admin/new_project/video_platform/prisma/seed-production.ts',
  '/Users/admin/new_project/video_platform/scripts/seed-full-campaign-flow.js',
  '/Users/admin/new_project/video_platform/scripts/seed-campaigns.js',
  '/Users/admin/new_project/video_platform/scripts/fix-campaign-categories.js',
  '/Users/admin/new_project/video_platform/scripts/check-categories.js',
  '/Users/admin/new_project/video_platform/scripts/check-json-fields.js',
  '/Users/admin/new_project/video_platform/scripts/check-campaign-data.js',
  '/Users/admin/new_project/video_platform/scripts/upload-campaigns.js',
  '/Users/admin/new_project/video_platform/debug-campaigns.js',
  '/Users/admin/new_project/video_platform/prisma/seed-local.js',
  '/Users/admin/new_project/video_platform/prisma/seed-production.js'
];

let totalFiles = 0;
let totalReplacements = 0;

console.log('🚀 Fixing all Prisma model references...');

filesToCheck.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let replacements = 0;
      
      // 모든 모델 매핑에 대해 처리
      Object.entries(modelMappings).forEach(([oldModel, newModel]) => {
        const regex = new RegExp(oldModel.replace(/\./g, '\\.'), 'g');
        const matches = (updatedContent.match(regex) || []).length;
        if (matches > 0) {
          updatedContent = updatedContent.replace(regex, newModel);
          replacements += matches;
        }
      });
      
      if (replacements > 0) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Fixed ${replacements} references in ${path.basename(filePath)}`);
        totalFiles++;
        totalReplacements += replacements;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
});

console.log(`\n🎉 Completed! Fixed ${totalReplacements} references in ${totalFiles} files.`);