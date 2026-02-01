/**
 * E-commerce Demo Template
 * 
 * Perfect for: Online stores, marketplaces, shopping experiences
 * Shows: Browse products, product details, add to cart, checkout flow
 */

const { chromium } = require('playwright');

// ===== CONFIGURATION =====
const CONFIG = {
  url: 'https://your-store.com',
  width: 1280,
  height: 720,
};
// =========================

async function recordEcommerceDemo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { 
      dir: './recordings/', 
      size: { width: CONFIG.width, height: CONFIG.height } 
    },
    viewport: { width: CONFIG.width, height: CONFIG.height }
  });
  
  const page = await context.newPage();
  
  // --- HOMEPAGE ---
  console.log('📍 Loading store homepage...');
  await page.goto(CONFIG.url);
  await page.waitForTimeout(3000);
  
  // --- BROWSE CATEGORIES ---
  console.log('📍 Browsing categories...');
  try {
    await page.click('text=Shop, text=Products, text=Categories, nav a >> nth=1');
    await page.waitForTimeout(2500);
  } catch (e) {
    console.log('   Category link not found, continuing...');
  }
  
  // --- VIEW PRODUCT ---
  console.log('📍 Viewing a product...');
  try {
    // Click first product card
    await page.click('.product-card, .product-item, [data-product], article >> nth=0');
    await page.waitForTimeout(2500);
    
    // Scroll to see details
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log('   Product not found, continuing...');
  }
  
  // --- ADD TO CART ---
  console.log('📍 Adding to cart...');
  try {
    await page.click('text=Add to Cart, text=Add to Bag, button:has-text("Add")');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('   Add to cart button not found, continuing...');
  }
  
  // --- VIEW CART ---
  console.log('📍 Viewing cart...');
  try {
    await page.click('[data-cart], .cart-icon, text=Cart, a[href*="cart"]');
    await page.waitForTimeout(2500);
  } catch (e) {
    console.log('   Cart icon not found, continuing...');
  }
  
  // --- CHECKOUT PREVIEW ---
  console.log('📍 Checkout preview...');
  try {
    await page.click('text=Checkout, text=Proceed');
    await page.waitForTimeout(2000);
    // Don't actually fill payment info in demo
    await page.goBack();
    await page.waitForTimeout(1500);
  } catch (e) {
    console.log('   Checkout button not found, continuing...');
  }
  
  // --- FINAL PAUSE ---
  await page.waitForTimeout(2000);
  
  await context.close();
  await browser.close();
  
  console.log('✅ Recording complete!');
}

recordEcommerceDemo().catch(console.error);
