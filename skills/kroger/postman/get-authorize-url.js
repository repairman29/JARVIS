#!/usr/bin/env node
/**
 * Print Kroger authorize URL for Postman flow (no .env needed).
 * Usage: node skills/kroger/postman/get-authorize-url.js YOUR_CLIENT_ID [REDIRECT_URI]
 * Default REDIRECT_URI: https://oauth.pstmn.io/v1/callback
 */
const clientId = process.argv[2];
const redirectUri = process.argv[3] || 'https://oauth.pstmn.io/v1/callback';
const scopes = 'cart.basic:rw profile.compact';

if (!clientId) {
  console.error('Usage: node skills/kroger/postman/get-authorize-url.js YOUR_CLIENT_ID [REDIRECT_URI]');
  process.exit(1);
}

const authUrl = `https://api.kroger.com/v1/connect/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;

console.log('\n--- Open this URL in your browser, log in with Kroger, then copy the "code" from the redirect URL ---\n');
console.log(authUrl);
console.log('\n--- Add this redirect URI in Kroger Developer Portal if not already: ---\n');
console.log(redirectUri);
console.log('');
