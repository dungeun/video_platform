#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need fixing
const seedFiles = [
  '/Users/admin/new_project/video_platform/prisma/seed-sample-data.ts',
];

console.log('🚀 Fixing all remaining seed files...');

seedFiles.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    console.log(`Processing: ${path.basename(filePath)}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix businessProfile -> business_profiles
    if (content.includes('businessProfile:')) {
      content = content.replace(/businessProfile:/g, 'business_profiles:');
      modified = true;
      console.log('  ✅ Fixed businessProfile -> business_profiles');
    }

    // Fix profile: -> profiles:
    if (content.includes('profile: {') && !content.includes('profiles: {')) {
      content = content.replace(/profile: \{/g, 'profiles: {');
      modified = true;
      console.log('  ✅ Fixed profile -> profiles');
    }

    // Fix include references
    if (content.includes('businessProfile: true')) {
      content = content.replace(/businessProfile: true/g, 'business_profiles: true');
      modified = true;
      console.log('  ✅ Fixed include businessProfile -> business_profiles');
    }

    if (content.includes('profile: true')) {
      content = content.replace(/profile: true/g, 'profiles: true');
      modified = true;
      console.log('  ✅ Fixed include profile -> profiles');
    }

    // Add required fields to users.create operations that are missing them
    const userCreatePattern = /data:\s*\{([^}]*email:\s*[^,]*,[^}]*type:\s*[^,]*,[^}]*status:\s*[^,]*,(?![^}]*\bid:)[^}]*)\}/gs;
    content = content.replace(userCreatePattern, (match) => {
      if (!match.includes('id:') || !match.includes('updatedAt:')) {
        // Generate a unique ID based on email or random string
        const updatedMatch = match.replace('data: {', `data: {
        id: 'user-${Math.random().toString(36).substr(2, 9)}',`)
        .replace(/status:\s*'[^']*',/, (statusMatch) => {
          return statusMatch + `
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),`;
        });
        modified = true;
        console.log('  ✅ Added required fields to user create operation');
        return updatedMatch;
      }
      return match;
    });

    // Add required fields to nested create operations (profiles, business_profiles)
    const nestedCreatePattern = /(business_profiles|profiles):\s*\{\s*create:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
    content = content.replace(nestedCreatePattern, (match, relation, createData) => {
      if (!createData.includes('id:') || !createData.includes('updatedAt:')) {
        const updatedCreateData = `id: '${relation.slice(0, -1)}-${Math.random().toString(36).substr(2, 9)}',
            ${createData.trim()},
            createdAt: new Date(),
            updatedAt: new Date()`;
        
        const updatedMatch = match.replace(createData, updatedCreateData);
        modified = true;
        console.log(`  ✅ Added required fields to ${relation} create operation`);
        return updatedMatch;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Successfully updated ${path.basename(filePath)}`);
    } else {
      console.log(`  ➡️  No changes needed for ${path.basename(filePath)}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n🎉 Completed fixing all seed files!');