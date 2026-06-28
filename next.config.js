/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output untuk Docker (smaller image, no need to install deps)
  output: "standalone",

  // Prisma query engine binary tidak ikut ter-trace otomatis oleh Next.js.
  // Include manual supaya ada di .next/standalone saat run di container.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/*.node",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**",
      "./node_modules/.pnpm/prisma@*/node_modules/prisma/**",
    ],
  },

  // Disable telemetry
  experimental: {
    // Enable React Compiler kalau sudah stabil
    // reactCompiler: true,
  },

  // Allow optimized images dari domain mana saja (untuk icon eksternal)
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
