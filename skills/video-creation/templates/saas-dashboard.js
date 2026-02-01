/**
 * SaaS Dashboard Demo Template
 * 
 * Usage: 
 *   1. Edit the CONFIG section below
 *   2. Run: node saas-dashboard.js
 *   3. Video saved to ./recordings/
 */

const { chromium } = require('playwright');

// ===== CONFIGURATION =====
const CONFIG = {
  url: 'https://app.yoursite.com',
  loginUrl: 'https://app.yoursite.com/login',
  email: 'demo@example.com',
  password: 'demopassword',
  width: 1920,
  height: 1080,
};
// =========================

async function recordDashboardDemo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { 
      dir: './recordings/', 
      size: { width: CONFIG.width, height: CONFIG.height } 
    },
    viewport: { width: CONFIG.width, height: CONFIG.height }
  });
  
  const page = await context.newPage();
  
  // --- LOGIN ---
  console.log('📍 Logging in...');
  await page.goto(CONFIG.loginUrl);
  await page.waitForTimeout(1500);
  
  await page.fill('input[type="email"], input[name="email"]', CONFIG.email);
  await page.waitForTimeout(500);
  
  await page.fill('input[type="password"], input[name="password"]', CONFIG.password);
  await page.waitForTimeout(500);
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // --- DASHBOARD OVERVIEW ---
  console.log('📍 Dashboard overview...');
  await page.waitForTimeout(2000);
  
  // Scroll to show stats/charts
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
  
  // --- NAVIGATE TO FEATURES ---
  console.log('📍 Exploring features...');
  
  // Click on Analytics/Reports
  try {
    await page.click('text=Analytics', { timeout: 3000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    console.log('   Analytics link not found, skipping');
  }
  
  // Click on Settings
  try {
    await page.click('text=Settings', { timeout: 3000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    console.log('   Settings link not found, skipping');
  }
  
  // --- CREATE SOMETHING ---
  console.log('📍 Creating new item...');
  try {
    await page.click('text=New, text=Create, button:has-text("+")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    
    // Fill creation form
    await page.fill('input[name="name"], input[name="title"]', 'Demo Project');
    await page.waitForTimeout(1000);
    
    // Submit (but don't actually create in demo)
    // await page.click('button[type="submit"]');
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('   Create button not found, skipping');
  }
  
  // --- FINAL PAUSE ---
  await page.waitForTimeout(2000);
  
  await context.close();
  await browser.close();
  
  console.log('✅ Recording complete!');
}

recordDashboardDemo().catch(console.error);
