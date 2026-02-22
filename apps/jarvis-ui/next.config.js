const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Monorepo: trace from repo root to silence lockfile warning and include correct deps
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

module.exports = nextConfig;
