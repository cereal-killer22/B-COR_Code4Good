/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@climaguard/ui', '@climaguard/shared'],
  experimental: {
    esmExternals: true,
  },
};

module.exports = nextConfig;