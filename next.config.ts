import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/bilan", destination: "/suivi", permanent: true },
    ];
  },
};

export default nextConfig;
