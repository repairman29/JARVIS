/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? { outputFileTracingRoot: path.resolve(__dirname) } : undefined,
};

module.exports = nextConfig;
