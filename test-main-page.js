// Test main page rendering
const puppeteer = require('puppeteer');

async function testMainPage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('Main Page Debug') || 
        msg.text().includes('realestate') ||
        msg.text().includes('Rendering')) {
      console.log('Browser console:', msg.text());
    }
  });
  
  // Navigate to the main page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Wait for sections to load
  await page.waitForTimeout(2000);
  
  // Check for real estate section
  const realEstateSection = await page.$eval('body', (body) => {
    const text = body.innerText;
    return {
      hasTitle: text.includes('최신 부동산 유튜브'),
      hasDescription: text.includes('부동산 전문 유튜버'),
      fullText: text.substring(0, 500)
    };
  });
  
  console.log('\n=== Real Estate Section Check ===');
  console.log('Has title:', realEstateSection.hasTitle);
  console.log('Has description:', realEstateSection.hasDescription);
  
  // Get all section headings
  const headings = await page.$$eval('h2', (elements) => 
    elements.map(el => el.innerText)
  );
  
  console.log('\n=== All Section Headings ===');
  headings.forEach(h => console.log(`- ${h}`));
  
  // Check API response
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/api/home/videos?section=all');
    const data = await response.json();
    return {
      sections: Object.keys(data.sections || {}),
      realestateCount: data.sections?.realestate?.length || 0
    };
  });
  
  console.log('\n=== API Response ===');
  console.log('Sections:', apiResponse.sections);
  console.log('Real estate videos:', apiResponse.realestateCount);
  
  await browser.close();
}

testMainPage().catch(console.error);