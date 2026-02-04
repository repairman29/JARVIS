#!/usr/bin/env node
/**
 * Kroger Assisted Checkout
 * 
 * Opens browser, navigates to checkout, pauses for your confirmation.
 * You stay in control - see the order before it's placed.
 * 
 * Usage:
 *   node checkout-assist.js              # Open cart and checkout
 *   node checkout-assist.js --confirm    # Auto-confirm (use with caution)
 */

const { chromium } = require('playwright');
const readline = require('readline');

const KROGER_CART_URL = 'https://www.kroger.com/shopping/cart';
const KROGER_LOGIN_URL = 'https://www.kroger.com/signin';

// Session storage path - keeps you logged in
const SESSION_PATH = require('path').join(
  process.env.HOME || '',
  '.clawdbot',
  'kroger-session'
);

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  const autoConfirm = process.argv.includes('--confirm');
  
  console.log('\n🛒 Kroger Assisted Checkout\n');
  console.log('Opening browser...\n');

  // Launch browser with persistent context (keeps login)
  const browser = await chromium.launchPersistentContext(SESSION_PATH, {
    headless: false, // Show the browser so you can see what's happening
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = browser.pages()[0] || await browser.newPage();
  
  try {
    // Go to cart
    console.log('📦 Opening your cart...');
    await page.goto(KROGER_CART_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check if we need to login
    if (page.url().includes('signin') || page.url().includes('login')) {
      console.log('\n⚠️  You need to log in to Kroger.');
      console.log('   Please log in using the browser window.');
      console.log('   (Your session will be saved for next time)\n');
      
      // Wait for user to login and get redirected
      await page.waitForURL('**/cart**', { timeout: 300000 }); // 5 min timeout
      console.log('✓ Logged in successfully!\n');
    }

    // Wait for cart to load
    await page.waitForTimeout(2000);

    // Try to get cart summary
    let cartTotal = 'Unknown';
    let itemCount = 'Unknown';
    
    try {
      // Look for cart total - Kroger's selectors may vary
      const totalEl = await page.$('[data-testid="cart-total"], .kds-Price, .CartSummary-total');
      if (totalEl) {
        cartTotal = await totalEl.textContent();
      }
      
      // Count items
      const items = await page.$$('[data-testid="cart-item"], .CartItem, .cart-item');
      itemCount = items.length || 'Some';
    } catch (e) {
      console.log('(Could not read cart details automatically)');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Cart Items: ${itemCount}`);
    console.log(`  Estimated Total: ${cartTotal}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('👀 Review your cart in the browser window.\n');

    if (!autoConfirm) {
      const answer = await prompt('Proceed to checkout? (yes/no): ');
      
      if (answer !== 'yes' && answer !== 'y') {
        console.log('\n❌ Checkout cancelled. Browser will stay open for you to review.\n');
        console.log('Close the browser when done, or press Ctrl+C to exit.\n');
        
        // Keep browser open
        await new Promise(() => {});
        return;
      }
    }

    // Click checkout button
    console.log('\n🛍️  Proceeding to checkout...');
    
    // Look for checkout button - try multiple selectors
    const checkoutButton = await page.$('button:has-text("Checkout"), [data-testid="checkout-button"], a:has-text("Checkout")');
    
    if (checkoutButton) {
      await checkoutButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('Could not find checkout button automatically.');
      console.log('Please click the Checkout button in the browser.\n');
    }

    // Wait for checkout page to load
    await page.waitForURL('**/checkout**', { timeout: 30000 }).catch(() => {});
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎯 CHECKOUT PAGE REACHED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👉 Complete these steps in the browser:');
    console.log('   1. Select pickup time');
    console.log('   2. Verify payment method');
    console.log('   3. Click "Place Order"\n');
    
    if (!autoConfirm) {
      const finalAnswer = await prompt('Should I click "Place Order" for you? (yes/no): ');
      
      if (finalAnswer === 'yes' || finalAnswer === 'y') {
        // Try to find and click place order button
        const placeOrderBtn = await page.$('button:has-text("Place Order"), button:has-text("Submit Order"), [data-testid="place-order"]');
        
        if (placeOrderBtn) {
          console.log('\n🚀 Placing order...');
          await placeOrderBtn.click();
          await page.waitForTimeout(5000);
          console.log('\n✅ Order placed! Check the browser for confirmation.\n');
        } else {
          console.log('\nCould not find "Place Order" button. Please click it manually.\n');
        }
      } else {
        console.log('\n👍 No problem! Complete the order manually in the browser.\n');
      }
    }

    // Keep browser open for user to see confirmation
    console.log('Browser will stay open. Press Ctrl+C when done.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nBrowser will stay open for you to complete manually.\n');
    await new Promise(() => {});
  }
}

main().catch(console.error);
