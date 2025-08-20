#!/usr/bin/env node

const fs = require('fs');

const filePath = '/Users/admin/new_project/video_platform/prisma/seed-posts.ts';

console.log('🚀 Fixing seed-posts.ts users creation...');

let content = fs.readFileSync(filePath, 'utf8');

// Fix all upsert create blocks for users
const userCreations = [
  {
    email: 'beauty@example.com',
    name: '뷰티크리에이터A',
    id: 'beauty-user-001'
  },
  {
    email: 'fashion@example.com', 
    name: '패션크리에이터B',
    id: 'fashion-user-001'
  },
  {
    email: 'food@example.com',
    name: '푸드크리에이터C', 
    id: 'food-user-001'
  },
  {
    email: 'travel@example.com',
    name: '여행크리에이터D',
    id: 'travel-user-001'
  },
  {
    email: 'tech@example.com',
    name: '테크크리에이터E',
    id: 'tech-user-001'
  }
];

userCreations.forEach(user => {
  // Find and replace the create block for each user
  const oldPattern = new RegExp(
    `create: {\\s*email: '${user.email}',\\s*password: '\\$2a\\$12\\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKpQj6oqFmxGwQq',\\s*name: '${user.name}',\\s*type: 'INFLUENCER'\\s*}`,
    'g'
  );
  
  const replacement = `create: {
          id: '${user.id}',
          email: '${user.email}',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKpQj6oqFmxGwQq',
          name: '${user.name}',
          type: 'INFLUENCER',
          status: 'ACTIVE',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }`;
  
  content = content.replace(oldPattern, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed seed-posts.ts users creation');