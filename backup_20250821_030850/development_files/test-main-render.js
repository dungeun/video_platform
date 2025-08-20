// Test to see what's being rendered on the main page

async function testMainRender() {
  try {
    // Test API
    const apiResponse = await fetch('http://localhost:3000/api/home/videos?section=all');
    const apiData = await apiResponse.json();
    
    console.log('=== API Response ===');
    console.log('Has realestate section:', !!apiData.sections?.realestate);
    console.log('Real estate videos count:', apiData.sections?.realestate?.length || 0);
    
    if (apiData.sections?.realestate?.length > 0) {
      console.log('\nFirst real estate video:');
      console.log('- Title:', apiData.sections.realestate[0].title);
      console.log('- Category:', apiData.sections.realestate[0].category);
      console.log('- Tags:', apiData.sections.realestate[0].tags);
    }
    
    // Check main page HTML
    const htmlResponse = await fetch('http://localhost:3000');
    const html = await htmlResponse.text();
    
    console.log('\n=== Main Page HTML ===');
    console.log('Has "최신 부동산 유튜브":', html.includes('최신 부동산 유튜브'));
    console.log('Has "부동산 전문 유튜버":', html.includes('부동산 전문 유튜버'));
    
    // Count section headings
    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/g) || [];
    console.log('\n=== Section Headings Found ===');
    h2Matches.forEach(h2 => {
      const title = h2.replace(/<[^>]+>/g, '');
      console.log('- ' + title);
    });
    
    // Check for real estate videos in HTML
    const realEstateMatches = (html.match(/부동산/g) || []).length;
    console.log('\n=== Real Estate Mentions ===');
    console.log('Total "부동산" mentions in HTML:', realEstateMatches);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMainRender();