const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Monorepo: trace from repo root locally; skip on Vercel to avoid path duplication (ENOENT routes-manifest.json)
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(__dirname, '../..') }),
};

module.exports = nextConfig;
