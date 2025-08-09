#!/usr/bin/env node

const fs = require('fs');

const filePath = '/Users/admin/new_project/video_platform/prisma/seed-sample-data.ts';

console.log('🚀 Manually fixing seed-sample-data.ts...');

let content = fs.readFileSync(filePath, 'utf8');

// Fix malformed payment structure
content = content.replace(
  /orderId: `ORDER_\$\{faker\.string\.alphanumeric\(10\)\},\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)\s*\}\`,/g,
  `orderId: \`ORDER_\${faker.string.alphanumeric(10)}\`,`
);

// Fix malformed content structure  
content = content.replace(
  /reviewedAt: faker\.datatype\.boolean\(0\.6\) \? faker\.date\.recent\(\) : null\s*,\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)/g,
  `reviewedAt: faker.datatype.boolean(0.6) ? faker.date.recent() : null,
          createdAt: new Date(),
          updatedAt: new Date()`
);

// Fix malformed notification structure
content = content.replace(
  /readAt: faker\.datatype\.boolean\(0\.4\) \? faker\.date\.recent\(\) : null\s*,\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)/g,
  `readAt: faker.datatype.boolean(0.4) ? faker.date.recent() : null,
        createdAt: new Date(),
        updatedAt: new Date()`
);

// Fix malformed follow structure
content = content.replace(
  /followingId: following\.id\s*,\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)/g,
  `followingId: following.id,
          createdAt: new Date(),
          updatedAt: new Date()`
);

// Fix malformed post structure
content = content.replace(
  /views: faker\.number\.int\(\{ min: 0, max: 500 \},\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)\s*\}\),/g,
  `views: faker.number.int({ min: 0, max: 500 }),`
);

// Fix remaining malformed structures
content = content.replace(/,\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\)\s*\}/g, ',\n        createdAt: new Date(),\n        updatedAt: new Date()\n      }');

// Ensure all payments have proper closing
content = content.replace(
  /receipt: faker\.datatype\.boolean\(0\.8\) \? faker\.internet\.url\(\) : null$/gm,
  `receipt: faker.datatype.boolean(0.8) ? faker.internet.url() : null,
        createdAt: new Date(),
        updatedAt: new Date()`
);

// Ensure all posts have proper closing  
content = content.replace(
  /isPinned: faker\.datatype\.boolean\(0\.1\)$/gm,
  `isPinned: faker.datatype.boolean(0.1),
        createdAt: new Date(),
        updatedAt: new Date()`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Manually fixed seed-sample-data.ts');