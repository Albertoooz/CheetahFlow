import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Reduces occasional stale vendor-chunk issues with Headless UI in monorepos. */
  transpilePackages: ["@headlessui/react"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
