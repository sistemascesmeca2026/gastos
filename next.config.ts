import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['gastos.clickwebhoover.online'],
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
