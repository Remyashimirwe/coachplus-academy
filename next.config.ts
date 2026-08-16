import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
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
};

export default nextConfig;
