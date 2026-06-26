const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@faralin/types', '@faralin/utils', '@faralin/ui'],
};

module.exports = nextConfig;