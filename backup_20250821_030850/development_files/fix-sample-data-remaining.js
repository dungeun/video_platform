#!/usr/bin/env node

const fs = require('fs');

const filePath = '/Users/admin/new_project/video_platform/prisma/seed-sample-data.ts';

console.log('🚀 Fixing remaining create operations in seed-sample-data.ts...');

let content = fs.readFileSync(filePath, 'utf8');

// Fix contents.create
content = content.replace(
  /const content = await prisma\.contents\.create\(\{\s*data: \{(\s*applicationId:[^}]+)\}/gs,
  `const content = await prisma.contents.create({
        data: {
          id: \`content-\${Math.random().toString(36).substr(2, 9)}\`,
          $1,
          createdAt: new Date(),
          updatedAt: new Date()
        }`
);

// Fix payments.create
content = content.replace(
  /const payment = await prisma\.payments\.create\(\{\s*data: \{(\s*orderId:[^}]+)\}/gs,
  `const payment = await prisma.payments.create({
      data: {
        id: \`payment-\${Math.random().toString(36).substr(2, 9)}\`,
        $1,
        createdAt: new Date(),
        updatedAt: new Date()
      }`
);

// Fix notifications.create
content = content.replace(
  /const notification = await prisma\.notifications\.create\(\{\s*data: \{(\s*userId:[^}]+)\}/gs,
  `const notification = await prisma.notifications.create({
      data: {
        id: \`notification-\${Math.random().toString(36).substr(2, 9)}\`,
        $1,
        createdAt: new Date(),
        updatedAt: new Date()
      }`
);

// Fix follows.create
content = content.replace(
  /const follow = await prisma\.follows\.create\(\{\s*data: \{(\s*followerId:[^}]+)\}/gs,
  `const follow = await prisma.follows.create({
        data: {
          id: \`follow-\${Math.random().toString(36).substr(2, 9)}\`,
          $1,
          createdAt: new Date(),
          updatedAt: new Date()
        }`
);

// Fix posts.create
content = content.replace(
  /const post = await prisma\.posts\.create\(\{\s*data: \{(\s*title:[^}]+)\}/gs,
  `const post = await prisma.posts.create({
      data: {
        id: \`post-\${Math.random().toString(36).substr(2, 9)}\`,
        $1,
        createdAt: new Date(),
        updatedAt: new Date()
      }`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all remaining create operations in seed-sample-data.ts');