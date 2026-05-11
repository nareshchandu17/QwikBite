/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable experimental features for better Tailwind CSS support
  experimental: {
    optimizeCss: false, // Set to false because 'critters' dependency is missing
    webpackBuildWorker: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: [
      'images.pexels.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'media.istockphoto.com',
      'images.istockphoto.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `net` and other Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
  env: {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || 'qwikBite <noreply@qwikbite.app>',
  },
};

export default nextConfig;
