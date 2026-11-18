import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Minimal server.js + traced node_modules for the Docker image (ticket 03).
  output: "standalone",
}

export default nextConfig
