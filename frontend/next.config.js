/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external image sources (for WhatsApp profile pictures and media)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wasenderapi.com",
      },
      {
        protocol: "https",
        hostname: "*.wasenderapi.com",
      },
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
