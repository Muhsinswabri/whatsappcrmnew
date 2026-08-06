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

    const wa2Base =
      process.env.NEXT_PUBLIC_WA2_API_URL || "https://wa2-api.vercel.app/api";

    return [
      {
        source: "/wa2-api/:path*",
        destination: `${wa2Base}/:path*`,
      },
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
