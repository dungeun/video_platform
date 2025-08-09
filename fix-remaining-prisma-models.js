#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Model mappings for singular to plural
const modelMappings = [
  ['prisma\\.payment\\.', 'prisma.payments.'],
  ['prisma\\.settlement\\.', 'prisma.settlements.'],
  ['prisma\\.user\\.', 'prisma.users.'],
  ['prisma\\.profile\\.', 'prisma.profiles.'],
  ['prisma\\.campaign\\.', 'prisma.campaigns.'],
  ['prisma\\.application\\.', 'prisma.campaign_applications.'],
  ['prisma\\.content\\.', 'prisma.contents.'],
  ['prisma\\.notification\\.', 'prisma.notifications.'],
  ['prisma\\.follow\\.', 'prisma.follows.'],
  ['prisma\\.post\\.', 'prisma.posts.'],
  ['prisma\\.comment\\.', 'prisma.comments.'],
  ['prisma\\.businessProfile\\.', 'prisma.business_profiles.'],
  ['prisma\\.applicationTemplate\\.', 'prisma.application_templates.']
];

console.log('🚀 Fixing remaining Prisma model references...');

const srcDir = '/Users/admin/new_project/video_platform/src';

// Find all TypeScript files
try {
  const files = execSync(`find ${srcDir} -name "*.ts" -o -name "*.tsx"`, { encoding: 'utf8' }).trim().split('\n');
  
  let totalFixed = 0;
  
  modelMappings.forEach(([oldPattern, newPattern]) => {
    const command = `grep -l "${oldPattern}" ${files.join(' ')} 2>/dev/null || true`;
    try {
      const matchingFiles = execSync(command, { encoding: 'utf8' }).trim();
      
      if (matchingFiles) {
        const fileList = matchingFiles.split('\n');
        fileList.forEach(file => {
          if (file) {
            try {
              execSync(`sed -i '' 's/${oldPattern}/${newPattern}/g' "${file}"`);
              console.log(`✅ Fixed ${oldPattern} in ${path.basename(file)}`);
              totalFixed++;
            } catch (error) {
              console.error(`❌ Error fixing ${file}:`, error.message);
            }
          }
        });
      }
    } catch (error) {
      // No matches found, continue
    }
  });
  
  console.log(`\n🎉 Fixed ${totalFixed} Prisma model references!`);
  
} catch (error) {
  console.error('❌ Error finding files:', error.message);
}