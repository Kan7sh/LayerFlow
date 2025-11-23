// next.config.ts

// Keep nextConfig untyped so additional fields like `swcMinify` won't cause type errors
const nextConfig = {
  // enable SWC minify for build performance (optional, usually on by default)
  swcMinify: true,

  async headers() {
    return [
      // 1) Make the editor page(s) cross-origin-isolated so threaded WASM & SharedArrayBuffer work
      {
        source: "/editor/:path*", // change this to the route(s) where your editor runs (e.g. '/', '/app/editor', etc.)
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },

      // 2) Cache the model/WASM assets strongly so they are downloaded once
      {
        source: "/models/:all*", // your models are under public/models/
        headers: [
          // long cache lifetime; immutable because model files don't change frequently
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
