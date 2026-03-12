import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.30.226.88'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '172.30.226.88:3000'],
    }
  }
};

export default nextConfig;
