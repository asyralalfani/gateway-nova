/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker (smaller image, no need to install deps)
  output: "standalone",

  // The Prisma query engine binary isn't traced automatically by Next.js.
  // Include it manually so it lands in .next/standalone when running in the container.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*.node",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**",
      "./node_modules/.pnpm/prisma@*/node_modules/prisma/**",
    ],
  },

  // Disable telemetry
  experimental: {
    // Enable React Compiler once it stabilizes
    // reactCompiler: true,
  },

  // Allow optimized images from any domain (for external icons)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
