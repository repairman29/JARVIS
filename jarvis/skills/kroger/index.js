/**
 * Kroger/King Soopers skill — product search, stores, shopping list.
 * Requires: KROGER_CLIENT_ID, KROGER_CLIENT_SECRET, KROGER_LOCATION_ID
 * API: https://api.kroger.com/v1/
 */

// Auto-load env from ~/.clawdbot/.env if not already set
(function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.env.HOME || '', '.clawdbot', '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    });
  } catch (_) {}
})();

const KROGER_BASE = 'https://api.kroger.com/v1';
const TOKEN_URL = `${KROGER_BASE}/connect/oauth2/token`;
const AUTH_URL = `${KROGER_BASE}/connect/oauth2/authorize`;
const CART_URL = 'https://www.kroger.com/shopping/cart';
const PRODUCT_BASE = 'https://www.kroger.com/p';
const CART_SCOPES = 'cart.basic:write profile.compact';

// Hosted service mode (set KROGER_SERVICE_URL to enable)
const SERVICE_URL = process.env.KROGER_SERVICE_URL;
const SERVICE_SECRET = process.env.KROGER_SERVICE_SECRET;

// Get user ID for multi-user support (defaults to 'default')
function getUserId() {
  return process.env.KROGER_USER_ID || process.env.JARVIS_USER_ID || 'default';
}

// Call hosted service for cart operations
async function serviceAddToCart(items) {
  if (!SERVICE_URL || !SERVICE_SECRET) return null;
  const userId = getUserId();
  const res = await fetch(`${SERVICE_URL}/api/cart/${encodeURIComponent(userId)}/add`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': SERVICE_SECRET,
    },
    body: JSON.stringify({ items }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.needsAuth) {
    return { needsAuth: true, authUrl: data.authUrl, error: data.error };
  }
  if (!res.ok) {
    throw new Error(data.error || `Service error: ${res.status}`);
  }
  return { success: true };
}

// Check service status for user
async function serviceStatus() {
  if (!SERVICE_URL || !SERVICE_SECRET) return null;
  const userId = getUserId();
  const res = await fetch(`${SERVICE_URL}/api/status/${encodeURIComponent(userId)}`, {
    headers: { 'X-API-Secret': SERVICE_SECRET },
  });
  return res.json();
}

function getEnv(name) {
  const v = process.env[name];
  if (!v || v.startsWith('your_')) throw new Error(`Missing or invalid env: ${name}`);
  return v;
}

function getEnvOptional(name, defaultValue) {
  const v = process.env[name];
  if (v == null || v === '' || v.startsWith('your_')) return defaultValue;
  return v;
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
  const clientId = getEnv('KROGER_CLIENT_ID');
  const clientSecret = getEnv('KROGER_CLIENT_SECRET');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kroger token failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 1800) * 1000;
  return cachedToken;
}

let userAccessToken = null;
let userTokenExpiry = 0;

// Persist new refresh token to ~/.clawdbot/.env (Kroger tokens are single-use)
function persistRefreshToken(newToken) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.env.HOME || '', '.clawdbot', '.env');
    let content = '';
    try {
      content = fs.readFileSync(envPath, 'utf8');
    } catch (_) {
      return; // No .env file to update
    }
    const lines = content.split('\n');
    let found = false;
    const updated = lines.map((line) => {
      if (line.startsWith('KROGER_REFRESH_TOKEN=')) {
        found = true;
        return `KROGER_REFRESH_TOKEN=${newToken}`;
      }
      return line;
    });
    if (!found) {
      updated.push(`KROGER_REFRESH_TOKEN=${newToken}`);
    }
    fs.writeFileSync(envPath, updated.join('\n'), 'utf8');
  } catch (e) {
    console.error('Failed to persist Kroger refresh token:', e.message);
  }
}

async function getAccessTokenForUser() {
  const refreshToken = getEnvOptional('KROGER_REFRESH_TOKEN', null);
  if (!refreshToken) return null;
  if (userAccessToken && Date.now() < userTokenExpiry - 60000) return userAccessToken;
  const clientId = getEnv('KROGER_CLIENT_ID');
  const clientSecret = getEnv('KROGER_CLIENT_SECRET');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    userAccessToken = null;
    throw new Error(`Kroger user token failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  userAccessToken = data.access_token;
  userTokenExpiry = Date.now() + (data.expires_in || 1800) * 1000;
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    process.env.KROGER_REFRESH_TOKEN = data.refresh_token;
    persistRefreshToken(data.refresh_token);
  }
  return userAccessToken;
}

async function krogerFetchWithUserToken(method, path, body) {
  const token = await getAccessTokenForUser();
  if (!token) return null;
  const url = path.startsWith('http') ? path : `${KROGER_BASE}${path}`;
  const opts = {
    method: method || 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 401) {
    userAccessToken = null;
    const retry = await getAccessTokenForUser();
    if (retry) {
      opts.headers.Authorization = `Bearer ${retry}`;
      const retryRes = await fetch(url, opts);
      if (!retryRes.ok && retryRes.status !== 204) throw new Error(`Kroger Cart API: ${retryRes.status} ${await retryRes.text()}`);
      if (retryRes.status === 204) return { success: true }; // No content = success
      return retryRes.json();
    }
  }
  if (!res.ok && res.status !== 204) throw new Error(`Kroger Cart API: ${res.status} ${await res.text()}`);
  if (res.status === 204) return { success: true }; // No content = success for cart operations
  return res.json();
}

async function krogerFetch(path, params = {}, retries = 2) {
  const token = await getAccessToken();
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${KROGER_BASE}${path}?${qs}` : `${KROGER_BASE}${path}`;
  let res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  while (!res.ok && retries > 0 && (res.status === 429 || res.status >= 500)) {
    retries--;
    await new Promise((r) => setTimeout(r, 1000));
    res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kroger API ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

function productUrl(productId, description) {
  const id = String(productId || '').replace(/\D/g, '').slice(0, 13) || '0';
  return `${PRODUCT_BASE}/${slug(description || 'item')}/${id.padStart(13, '0')}`;
}

function formatProduct(p, withPrice = true) {
  const item = p.items && p.items[0];
  const productId = p.productId || (item && item.itemId) || p.upc;
  let priceStr = null;
  let priceNum = null;
  if (withPrice && item && item.price) {
    priceNum = item.price.promo > 0 ? item.price.promo : item.price.regular;
    priceStr = `$${Number(priceNum).toFixed(2)}`;
  }
  const size = item && item.size ? ` (${item.size})` : '';
  const description = p.description || p.brand;
  return {
    description,
    brand: p.brand,
    size: item && item.size,
    price: priceStr,
    priceNum,
    productId,
    upc: p.upc || productId,
    productUrl: productUrl(productId, description),
    line: [description, size, priceStr].filter(Boolean).join(' '),
  };
}

module.exports = {
  async kroger_search({ term, limit = 10, fulfillment }) {
    const locationId = process.env.KROGER_LOCATION_ID;
    const params = {
      'filter.term': term,
      'filter.limit': Math.min(Number(limit) || 10, 20),
    };
    if (locationId && !locationId.startsWith('your_')) params['filter.locationId'] = locationId;
    if (fulfillment === 'curbside' || fulfillment === 'csp') params['filter.fulfillment'] = 'csp';
    if (fulfillment === 'delivery') params['filter.fulfillment'] = 'delivery';
    const json = await krogerFetch('/products', params);
    const products = (json.data || []).map((p) => formatProduct(p));
    return {
      success: true,
      term,
      count: products.length,
      products: products.map((x) => x.line),
      productLinks: products.map((x) => x.productUrl),
      raw: products,
    };
  },

  async kroger_stores({ zipCode, radiusInMiles = 10 }) {
    const json = await krogerFetch('/locations', {
      'filter.zipCode.near': zipCode,
      'filter.radiusInMiles': Math.min(Number(radiusInMiles) || 10, 100),
      'filter.limit': 15,
    });
    const locations = (json.data || []).map((loc) => ({
      locationId: loc.locationId,
      name: loc.name,
      address: loc.address && [
        loc.address.addressLine1,
        loc.address.city,
        loc.address.state,
        loc.address.zipCode,
      ].filter(Boolean).join(', '),
    }));
    return { success: true, zipCode, stores: locations };
  },

  async kroger_shop({ items, fulfillment }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'Provide an array of item names (or { term, quantity } objects).' };
    }
    const locationId = process.env.KROGER_LOCATION_ID;
    const list = [];
    let subtotal = 0;
    const productLinks = [];
    for (const raw of items) {
      const term = typeof raw === 'string' ? raw.trim() : (raw && raw.term && String(raw.term).trim());
      const qty = typeof raw === 'object' && raw != null && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1;
      if (!term) continue;
      const params = { 'filter.term': term, 'filter.limit': 1 };
      if (locationId && !locationId.startsWith('your_')) params['filter.locationId'] = locationId;
      if (fulfillment === 'curbside' || fulfillment === 'csp') params['filter.fulfillment'] = 'csp';
      if (fulfillment === 'delivery') params['filter.fulfillment'] = 'delivery';
      const json = await krogerFetch('/products', params);
      const product = (json.data || [])[0];
      if (!product) {
        list.push({ term, quantity: qty, found: false, line: `${term}: not found` });
        continue;
      }
      const formatted = formatProduct(product);
      const lineTotal = formatted.priceNum != null ? formatted.priceNum * qty : 0;
      if (formatted.priceNum != null) subtotal += lineTotal;
      const qtyLabel = qty > 1 ? ` ×${qty}` : '';
      list.push({
        term,
        quantity: qty,
        found: true,
        line: `${formatted.line}${qtyLabel}`,
        price: formatted.price,
        lineTotal: lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : null,
        upc: formatted.upc,
        productUrl: formatted.productUrl,
      });
      productLinks.push(formatted.productUrl);
    }
    const summary = list
      .filter((x) => x.found)
      .map((x) => `• ${x.line}${x.lineTotal ? ` → ${x.lineTotal}` : ''}`)
      .join('\n');
    return {
      success: true,
      items: list.map((x) => x.line),
      total: subtotal > 0 ? `$${subtotal.toFixed(2)}` : null,
      cartUrl: CART_URL,
      productLinks: productLinks.length ? productLinks : undefined,
      orderSummary: summary || undefined,
      raw: list,
    };
  },

  async kroger_cart() {
    return {
      success: true,
      message: 'Open your Kroger cart in the browser to view or checkout.',
      cartUrl: CART_URL,
    };
  },

  async kroger_add_to_cart({ items, modality }) {
    const mod = (modality || getEnvOptional('KROGER_MODALITY', 'PICKUP')).toUpperCase();
    if (!['PICKUP', 'DELIVERY', 'SHIP'].includes(mod)) throw new Error('modality must be PICKUP, DELIVERY, or SHIP');
    const cartItems = (items || []).map((it) => {
      const raw = String(it.upc || it.productId || '').replace(/\D/g, '');
      const upc = raw.slice(-13).padStart(13, '0');
      const qty = Math.max(1, Number(it.quantity) || 1);
      return { upc, quantity: qty, modality: mod };
    }).filter((it) => it.upc.length === 13 && it.upc !== '0000000000000');
    if (cartItems.length === 0) {
      return { success: false, error: 'No valid items (need upc or productId).' };
    }

    // Try hosted service first (if configured)
    if (SERVICE_URL && SERVICE_SECRET) {
      try {
        const result = await serviceAddToCart(cartItems);
        if (result.needsAuth) {
          return {
            success: false,
            needsAuth: true,
            error: result.error || 'Kroger login required',
            authUrl: result.authUrl,
            cartUrl: CART_URL,
          };
        }
        return {
          success: true,
          message: `Added ${cartItems.length} item(s) to your Kroger cart.`,
          added: cartItems.map((it) => ({ upc: it.upc, quantity: it.quantity })),
          cartUrl: CART_URL,
        };
      } catch (e) {
        return { success: false, error: e.message, cartUrl: CART_URL };
      }
    }

    // Fallback to local tokens
    const refreshToken = getEnvOptional('KROGER_REFRESH_TOKEN', null);
    if (!refreshToken) {
      return {
        success: false,
        error: 'Add-to-cart requires Kroger login. Run: node skills/kroger/kroger-auth.js',
        needsAuth: true,
        cartUrl: CART_URL,
      };
    }
    // Test token validity early
    try {
      await getAccessTokenForUser();
    } catch (e) {
      if (e.message.includes('invalid refresh_token') || e.message.includes('invalid_request')) {
        return {
          success: false,
          error: 'Kroger session expired. Run: node skills/kroger/kroger-auth.js to re-login.',
          needsAuth: true,
          cartUrl: CART_URL,
        };
      }
      throw e;
    }
    // Use PUT /cart/add endpoint - only requires write permission, no need to read cart first
    const added = [];
    for (const it of cartItems) {
      try {
        await krogerFetchWithUserToken('PUT', '/cart/add', { items: [it] });
        added.push({ upc: it.upc, quantity: it.quantity });
      } catch (e) {
        added.push({ upc: it.upc, quantity: it.quantity, error: e.message });
      }
    }
    const successCount = added.filter((a) => !a.error).length;
    return {
      success: successCount > 0,
      message: successCount > 0 ? `Added ${successCount} item(s) to your Kroger cart.` : 'Failed to add items to cart.',
      added,
      cartUrl: CART_URL,
    };
  },

  async kroger_shop_and_add({ items, fulfillment, modality }) {
    const shopResult = await this.kroger_shop({ items, fulfillment });
    if (!shopResult.success) return shopResult;
    const withUpc = (shopResult.raw || []).filter((r) => r.found && r.upc);
    if (withUpc.length === 0) {
      return { ...shopResult, addToCartSuccess: false, message: 'List built but no items could be added to cart (no UPCs).' };
    }
    const cartItems = withUpc.map((r) => ({ upc: r.upc, quantity: r.quantity || 1 }));
    const addResult = await this.kroger_add_to_cart({ items: cartItems, modality });
    if (addResult.needsAuth) {
      return { ...shopResult, addToCartSuccess: false, needsAuth: true, addToCartResult: { error: addResult.error } };
    }
    const errors = (addResult.added || []).filter((a) => a.error).map((a) => a.error);
    return {
      ...shopResult,
      addToCartSuccess: addResult.success,
      addToCartResult: addResult.success 
        ? { added: addResult.added, cartUrl: addResult.cartUrl } 
        : { error: errors.length ? errors[0] : addResult.message, added: addResult.added },
    };
  },

  // Check if Kroger cart integration is working
  async kroger_status() {
    const hasClientCreds = !!(getEnvOptional('KROGER_CLIENT_ID', null) && getEnvOptional('KROGER_CLIENT_SECRET', null));
    const hasRefreshToken = !!getEnvOptional('KROGER_REFRESH_TOKEN', null);
    const locationId = getEnvOptional('KROGER_LOCATION_ID', null);
    const usingService = !!(SERVICE_URL && SERVICE_SECRET);
    
    if (!hasClientCreds) {
      return { ready: false, error: 'Missing KROGER_CLIENT_ID or KROGER_CLIENT_SECRET' };
    }
    
    // Test client credentials (for search)
    let searchWorking = false;
    try {
      await getAccessToken();
      searchWorking = true;
    } catch (e) {
      return { ready: false, searchWorking: false, error: 'Client credentials invalid: ' + e.message };
    }
    
    // Test user token (for cart) - check service or local
    let cartWorking = false;
    let cartError = null;
    let authUrl = null;
    
    if (usingService) {
      try {
        const status = await serviceStatus();
        cartWorking = status.connected;
        if (!cartWorking) {
          cartError = 'Not connected to Kroger';
          authUrl = status.authUrl;
        }
      } catch (e) {
        cartError = 'Service error: ' + e.message;
      }
    } else if (hasRefreshToken) {
      try {
        await getAccessTokenForUser();
        cartWorking = true;
      } catch (e) {
        cartError = 'Session expired - run: node skills/kroger/kroger-auth.js';
      }
    } else {
      cartError = 'No refresh token - run: node skills/kroger/kroger-auth.js';
    }
    
    return {
      ready: searchWorking,
      searchWorking,
      cartWorking,
      usingService,
      authUrl,
      locationId: locationId || 'not set',
      cartError,
      cartUrl: CART_URL,
    };
  },
};
