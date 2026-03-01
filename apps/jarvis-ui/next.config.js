const path = require('path');
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disableRedirectHandleSWR: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Monorepo: trace from repo root locally; skip on Vercel to avoid path duplication (ENOENT routes-manifest.json)
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(__dirname, '../..') }),
});

module.exports = nextConfig;
