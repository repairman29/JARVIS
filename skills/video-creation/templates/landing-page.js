/**
 * Landing Page Demo Template
 * 
 * Perfect for: Product launches, marketing sites, portfolios
 * Shows: Page load, scroll through sections, CTA interactions
 */

const { chromium } = require('playwright');

// ===== CONFIGURATION =====
const CONFIG = {
  url: 'https://yoursite.com',
  width: 1280,
  height: 720,
  scrollSpeed: 'smooth',  // 'smooth' or 'instant'
};
// =========================

async function recordLandingPageDemo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { 
      dir: './recordings/', 
      size: { width: CONFIG.width, height: CONFIG.height } 
    },
    viewport: { width: CONFIG.width, height: CONFIG.height }
  });
  
  const page = await context.newPage();
  
  // --- HERO SECTION ---
  console.log('📍 Loading hero section...');
  await page.goto(CONFIG.url);
  await page.waitForTimeout(3000);
  
  // --- SCROLL THROUGH PAGE ---
  console.log('📍 Scrolling through page...');
  
  // Get page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = CONFIG.height;
  const scrollSteps = Math.ceil(pageHeight / viewportHeight);
  
  // Smooth scroll through each section
  for (let i = 1; i <= scrollSteps; i++) {
    const scrollPosition = Math.min(i * viewportHeight * 0.7, pageHeight - viewportHeight);
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }, scrollPosition);
    await page.waitForTimeout(2500);
  }
  
  // --- SCROLL BACK TO TOP ---
  console.log('📍 Returning to top...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1500);
  
  // --- INTERACT WITH CTA ---
  console.log('📍 Hovering over CTA...');
  try {
    const cta = await page.$('text=Get Started, text=Sign Up, text=Try Free, .cta, [data-cta]');
    if (cta) {
      await cta.hover();
      await page.waitForTimeout(1000);
      // Optional: click
      // await cta.click();
      // await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.log('   CTA not found');
  }
  
  // --- FINAL PAUSE ---
  await page.waitForTimeout(2000);
  
  await context.close();
  await browser.close();
  
  console.log('✅ Recording complete!');
}

recordLandingPageDemo().catch(console.error);
