import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // For server-side builds, externalize these packages to prevent bundling
    if (isServer) {
      // Externalize canvas - it's a native Node.js module
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });

      // Don't bundle pdfjs-dist worker files on the server
      // This prevents Next.js from trying to resolve pdf.worker.mjs
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure we use the legacy build which works in Node.js
        'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs',
      };
    }

    // Ignore worker files during bundling
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },

  // Acknowledge Turbopack usage (Next.js 16 default)
  // Empty config is fine - Turbopack handles our externals automatically
  turbopack: {},

  // Disable server component external packages warnings for these modules
  serverExternalPackages: ['canvas', 'pdfjs-dist', 'sharp'],
};

export default nextConfig;
