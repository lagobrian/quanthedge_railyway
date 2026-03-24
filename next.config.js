/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com', '127.0.0.1', 'substack-post-media.s3.amazonaws.com', 'api.dicebear.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.onrender.com' },
      { protocol: 'https', hostname: 'substack-post-media.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    minimumCacheTTL: 3600,
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
    },
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "child_process": false,
      "fs": false,
      "net": false,
      "tls": false,
    };
    return config;
  },
  output: 'standalone',
};

module.exports = nextConfig;