#!/usr/bin/env node
/**
 * Website Demo Recorder
 * 
 * Usage:
 *   node record-website.js https://yoursite.com
 *   node record-website.js https://yoursite.com --output demo.webm
 *   node record-website.js https://yoursite.com --headless false
 * 
 * Then define your demo steps in the DEMO STEPS section below.
 */

const { chromium } = require('playwright');

// Configuration
const CONFIG = {
  url: process.argv[2] || 'https://example.com',
  output: process.argv.includes('--output') 
    ? process.argv[process.argv.indexOf('--output') + 1] 
    : './recordings/',
  headless: !process.argv.includes('--headless') || process.argv[process.argv.indexOf('--headless') + 1] !== 'false',
  width: 1280,
  height: 720,
  slowMo: 50,  // Slow down actions for visibility
};

async function recordDemo() {
  console.log(`🎬 Recording demo for: ${CONFIG.url}`);
  console.log(`📁 Output: ${CONFIG.output}`);
  
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
  });
  
  const context = await browser.newContext({
    recordVideo: {
      dir: CONFIG.output,
      size: { width: CONFIG.width, height: CONFIG.height }
    },
    viewport: { width: CONFIG.width, height: CONFIG.height },
  });
  
  const page = await context.newPage();
  
  // Optional: Add custom cursor for better visibility
  await page.addStyleTag({
    content: `
      .demo-cursor {
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, rgba(255,100,100,0.8) 0%, rgba(255,100,100,0) 70%);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: transform 0.1s ease;
      }
      .demo-cursor.clicking {
        transform: translate(-50%, -50%) scale(0.7);
      }
    `
  });
  
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.className = 'demo-cursor';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    
    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
  });

  // ============================================
  // DEMO STEPS - Customize this section!
  // ============================================
  
  try {
    // Step 1: Navigate to site
    await page.goto(CONFIG.url);
    await page.waitForTimeout(2000);
    
    // Step 2: Example - Click a button
    // await page.click('text=Get Started');
    // await page.waitForTimeout(2000);
    
    // Step 3: Example - Fill a form
    // await page.fill('input[name="email"]', 'demo@example.com');
    // await page.waitForTimeout(1000);
    
    // Step 4: Example - Submit
    // await page.click('button[type="submit"]');
    // await page.waitForTimeout(3000);
    
    // Step 5: Example - Navigate
    // await page.click('text=Dashboard');
    // await page.waitForTimeout(2000);
    
    // Add more steps as needed...
    
    // Final pause
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Error during recording:', error);
  }
  
  // ============================================
  // END DEMO STEPS
  // ============================================
  
  // Close to finalize video
  await context.close();
  await browser.close();
  
  console.log('✅ Recording complete!');
  console.log(`📁 Video saved to: ${CONFIG.output}`);
}

// Helper function for typing with realistic delay
async function typeSlowly(page, selector, text, delay = 100) {
  await page.click(selector);
  for (const char of text) {
    await page.type(selector, char, { delay });
  }
}

// Run
recordDemo().catch(console.error);
