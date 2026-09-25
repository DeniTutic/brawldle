import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Renders/ability icons are read from disk at runtime (never served directly), so they
  // must be traced into the serverless bundles of the API routes that use them.
  outputFileTracingIncludes: {
    "/api/**": ["./assets/**/*"],
  },
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
};

export default nextConfig;
