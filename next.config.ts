import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Minimal server.js + traced node_modules for the Docker image (ticket 03).
  output: "standalone",
  // initChatModel loads its provider package with a dynamic import(), which Turbopack cannot bundle.
  serverExternalPackages: ["langchain", "@langchain/core", "@langchain/openai"],
  // Speaking answers are uploaded through a server action: 2 min at 32 kbps is ~0.5 MB, but Safari
  // may ignore the requested bitrate, so allow up to 3 MB.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
}

export default nextConfig
