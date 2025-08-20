#!/usr/bin/env node

const fs = require('fs');

const filePath = '/Users/admin/new_project/video_platform/prisma/seed-real-accounts.ts';

console.log('🚀 Fixing seed-real-accounts.ts user and profile creation...');

let content = fs.readFileSync(filePath, 'utf8');

// Fix all profile create blocks - need to add id and updatedAt
const profileCreateBlocks = [
  {
    old: `          create: {
            bio: '테스트 인플루언서입니다',
            profileImage: 'https://example.com/profile.jpg',
            instagram: '@test_influencer',
            instagramFollowers: 50000,
            categories: JSON.stringify(['패션', '뷰티']),
            isVerified: true
          }`,
    new: `          create: {
            id: 'profile-real-001',
            bio: '테스트 인플루언서입니다',
            profileImage: 'https://example.com/profile.jpg',
            instagram: '@test_influencer',
            instagramFollowers: 50000,
            categories: JSON.stringify(['패션', '뷰티']),
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }`
  }
];

profileCreateBlocks.forEach(block => {
  content = content.replace(block.old, block.new);
});

// Also need to fix the main influencer user create block
const userCreatePattern = /create: {\s*email: 'user@example\.com',\s*password: hashedPassword,\s*name: '테스트 인플루언서',\s*type: 'INFLUENCER',\s*status: 'ACTIVE',/g;
const userCreateReplacement = `create: {
        id: 'influencer-real-001',
        email: 'user@example.com',
        password: hashedPassword,
        name: '테스트 인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),`;

content = content.replace(userCreatePattern, userCreateReplacement);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed seed-real-accounts.ts user and profile creation');