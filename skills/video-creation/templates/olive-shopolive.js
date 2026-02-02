/**
 * Olive (shopolive.xyz) Demo Template
 *
 * Promo flow: land → scroll to "Try the command flow" → add list → show Olive's
 * response (outcome) → show Connect Kroger CTA → end. Longer dwell so outcome is visible.
 * Run from repo root via: OLIVE_RECORDINGS_DIR=... node skills/video-creation/templates/olive-shopolive.js
 */

const { chromium } = require('playwright');
const path = require('path');

const CONFIG = {
  url: 'https://shopolive.xyz',
  width: 1280,
  height: 720,
  recordingsDir: process.env.OLIVE_RECORDINGS_DIR || path.join(__dirname, '..', 'recordings'),
  slowMo: 100,
  // Longer dwells so the video shows each outcome
  dwell: {
    afterLoad: 4000,
    afterScroll: 2000,
    afterType: 1500,
    afterAdd: 10000,   // Show Olive's response / "how Olive thinks" outcome
    afterOutcome: 5000,
    afterCta: 4000,
    outro: 4000,
  },
};

async function recordOliveDemo() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: CONFIG.slowMo,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: CONFIG.recordingsDir,
      size: { width: CONFIG.width, height: CONFIG.height },
    },
    viewport: { width: CONFIG.width, height: CONFIG.height },
  });

  const page = await context.newPage();
  const d = CONFIG.dwell;

  try {
    // --- 1. Land on shopolive.xyz and let hero load ---
    console.log('📍 Loading shopolive.xyz...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(d.afterLoad);

    // --- 2. Scroll to show value prop, then to "Try the command flow" ---
    console.log('📍 Scrolling to command flow...');
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await page.waitForTimeout(d.afterScroll);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
    await page.waitForTimeout(d.afterScroll);
    await page.evaluate(() => window.scrollTo({ top: 2200, behavior: 'smooth' }));
    await page.waitForTimeout(d.afterScroll);

    // --- 3. Find "Drop a list here" input and type a real list ---
    console.log('📍 Adding list (command flow)...');
    const listInputSelectors = [
      'textarea',
      'input[type="text"]',
      '[placeholder*="list"]',
      '[placeholder*="Drop"]',
      'form input',
      'form textarea',
    ];
    let typed = false;
    for (const sel of listInputSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await page.waitForTimeout(800);
          await page.keyboard.type('milk, eggs, sourdough, green apples', { delay: 90 });
          await page.waitForTimeout(d.afterType);
          typed = true;
          break;
        }
      } catch (_) {
        // continue
      }
    }

    // --- 4. Submit: click Add / Submit so Olive responds (the outcome) ---
    if (typed) {
      const addSelectors = [
        'button:has-text("Add")',
        'button[type="submit"]',
        'input[type="submit"]',
        '[type="submit"]',
        'button:has-text("See how")',
        'form button',
      ];
      for (const sel of addSelectors) {
        try {
          const btn = await page.$(sel);
          if (btn) {
            await btn.click();
            break;
          }
        } catch (_) {}
      }
      // Wait for Olive's response / parsed list / "how Olive thinks" outcome
      console.log('📍 Waiting for Olive outcome (parsed list / response)...');
      await page.waitForTimeout(d.afterAdd);
      // Extra dwell so viewer sees the result
      await page.waitForTimeout(d.afterOutcome);
    }

    // --- 5. Scroll to Connect Kroger and show CTA ---
    console.log('📍 Showing Connect Kroger...');
    await page.evaluate(() => window.scrollTo({ top: 1800, behavior: 'smooth' }));
    await page.waitForTimeout(d.afterScroll);
    const connectSelectors = [
      'a:has-text("Continue with Kroger")',
      'a:has-text("Connect Kroger")',
      '[href*="login"]',
    ];
    for (const sel of connectSelectors) {
      try {
        const link = await page.$(sel);
        if (link) {
          await link.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          break;
        }
      } catch (_) {}
    }
    await page.waitForTimeout(d.afterCta);

    // --- 6. Scroll back up to show hero / tagline, then outro ---
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(d.outro);
  } catch (err) {
    console.warn('Demo step error (continuing):', err.message);
  }

  await context.close();
  await browser.close();

  console.log('✅ Olive recording complete!');
}

recordOliveDemo().catch(console.error);
