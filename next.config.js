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

  // Proxy Wasender API calls through Next.js server to avoid CORS issues in browser
  async rewrites() {
    const wasenderBase =
      process.env.NEXT_PUBLIC_WASENDER_URL || "https://wasenderapi.com/api";
    const backendBase =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    return [
      {
        source: "/wasender-proxy/:path*",
        destination: `${wasenderBase}/:path*`,
      },
      {
        source: "/backend-api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
