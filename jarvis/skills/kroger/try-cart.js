#!/usr/bin/env node
/**
 * Try to add a small cart via the Kroger skill (for testing).
 * Needs: .env or ~/.clawdbot/.env with KROGER_CLIENT_ID, KROGER_CLIENT_SECRET, KROGER_LOCATION_ID, and optionally KROGER_REFRESH_TOKEN for add-to-cart.
 */
const path = require('path');
const fs = require('fs');

// Load .env: ~/.clawdbot/.env first (real credentials), then project .env so project can override
function loadEnv() {
  const clawdbotEnv = path.join(process.env.HOME || '', '.clawdbot', '.env');
  const projectEnv = path.join(process.cwd(), '.env');
  const candidates = [clawdbotEnv, projectEnv];
  for (const p of candidates) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      });
    } catch (_) {}
  }
}
loadEnv();

const skill = require('./index.js');

async function main() {
  const items = ['milk', 'eggs', 'bread'];
  console.log('Trying to build and add a small cart:', items.join(', '), '\n');

  // 1) Build list (always works with client credentials)
  const shop = await skill.kroger_shop({ items });
  if (!shop.success) {
    console.log('Shop result:', shop);
    return;
  }
  console.log('Shop result:');
  console.log(shop.orderSummary || shop.items?.join('\n'));
  console.log('Total:', shop.total);
  console.log('Cart URL:', shop.cartUrl, '\n');

  // 2) Try add-to-cart (needs KROGER_REFRESH_TOKEN)
  const add = await skill.kroger_shop_and_add({ items });
  console.log('Add-to-cart result:');
  if (add.addToCartSuccess) {
    console.log('Added to your Kroger cart:', add.addToCartResult?.added?.length ?? 0, 'items');
    console.log('Cart URL:', add.addToCartResult?.cartUrl);
  } else {
    console.log(add.addToCartResult?.error || add.message || add);
  }
}

main().catch((e) => {
  const msg = e.message || String(e);
  if (msg.includes('Missing or invalid env') || msg.includes('token failed') || msg.includes('401') || msg.includes('403')) {
    console.error('\nKroger credentials needed. Open the project .env file and replace:');
    console.error('  KROGER_CLIENT_ID, KROGER_CLIENT_SECRET, KROGER_LOCATION_ID');
    console.error('Get them from https://developer.kroger.com (Store ID: pick a store at kroger.com, use its 8-char ID).');
    console.error('Then run again: node skills/kroger/try-cart.js\n');
  } else {
    console.error(msg);
  }
  process.exit(1);
});
