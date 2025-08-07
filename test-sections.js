// Test script to check what sections are configured and visible

async function testSections() {
  try {
    // Check home API
    const homeResponse = await fetch('http://localhost:3000/api/home/videos?section=all&limit=12');
    const homeData = await homeResponse.json();
    
    console.log('=== HOME API RESPONSE ===');
    console.log('Sections available:', Object.keys(homeData.sections || {}));
    console.log('Real estate videos count:', homeData.sections?.realestate?.length || 0);
    
    if (homeData.sections?.realestate) {
      console.log('\n=== REAL ESTATE VIDEOS ===');
      homeData.sections.realestate.slice(0, 3).forEach(v => {
        console.log(`- ${v.title}`);
      });
    }
    
    // Check UI settings
    const settingsResponse = await fetch('http://localhost:3000/api/admin/settings');
    const settings = await settingsResponse.json();
    
    console.log('\n=== UI SETTINGS ===');
    if (settings.settings?.mainPage?.sectionOrder) {
      console.log('Section order:', settings.settings.mainPage.sectionOrder.map(s => 
        `${s.id}(type:${s.type}, visible:${s.visible}, order:${s.order})`
      ));
    } else {
      console.log('No custom section order configured');
    }
    
    if (settings.settings?.mainPage?.customSections) {
      console.log('\nCustom sections:', settings.settings.mainPage.customSections.map(s => 
        `${s.id}(title:${s.title}, visible:${s.visible})`
      ));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSections();