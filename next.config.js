/** @type {import('next').NextConfig} */
const nextConfig = {
  // Change from 'export' to standard mode to allow SSE
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;