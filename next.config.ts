import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack explicitly (silences the warning)
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure externals array exists
      config.externals = config.externals || [];

      // Add background removal package to externals
      if (Array.isArray(config.externals)) {
        config.externals.push("@imgly/background-removal-node");
      }
    }

    // Handle canvas and other node modules
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };

    return config;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
