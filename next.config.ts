import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // i18n removed — App Router supports locale prefixes manually
  // (e.g. /en/page, /fr/page). The middleware detects accept-language
  // and redirects; Navbar links switch locale via URL.
  experimental: {
    serverActions: {
      // Category/Sub-category/Subject forms allow image uploads up to 8MB
      // (see MAX_IMAGE_SIZE in app/actions/admin.ts). The framework default
      // of 1MB is well below that, so any meaningfully sized image upload
      // was rejected with "Body exceeded 1 MB limit" before the action code
      // even ran. Raise it to comfortably fit an 8MB image plus multipart
      // overhead and the rest of the form fields.
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    // The mobile app talks to this API directly. Browsers block those calls
    // (and report only "Failed to fetch") unless the response allows the
    // origin, so expose the public API cross-origin. No credentials are
    // allowed here: app requests use a Bearer token, and the admin dashboard
    // stays same-origin with its cookies.
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
