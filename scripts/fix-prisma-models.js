#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in src directory
const files = glob.sync('src/**/*.{ts,tsx}', {
  cwd: path.join(__dirname, '..'),
  absolute: true,
});

console.log(`Found ${files.length} TypeScript files to check...`);

let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace prisma.user with prisma.users
  content = content.replace(/prisma\.user\./g, 'prisma.users.');
  
  // Replace model references in types/interfaces
  content = content.replace(/from\s+['"]@prisma\/client['"].*?user\b/g, (match) => {
    return match.replace(/\buser\b/, 'users');
  });
  
  // Count replacements
  if (content !== originalContent) {
    const replacements = (content.match(/prisma\.users\./g) || []).length - 
                         (originalContent.match(/prisma\.users\./g) || []).length;
    totalReplacements += replacements;
    
    console.log(`✓ Updated ${path.relative(process.cwd(), file)} (${replacements} replacements)`);
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(`\n✅ Fixed ${totalReplacements} occurrences of prisma.user to prisma.users`);