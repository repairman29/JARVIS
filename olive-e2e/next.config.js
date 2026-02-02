/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  output: process.env.NODE_ENV === 'production' ? { outputFileTracingRoot: path.resolve(__dirname) } : undefined,
};

module.exports = nextConfig;
