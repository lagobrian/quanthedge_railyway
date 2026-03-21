/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com', '127.0.0.1'],
  },
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
  experimental: {
    serverActions: {
      enabled: true
    }
  },
};

module.exports = nextConfig;