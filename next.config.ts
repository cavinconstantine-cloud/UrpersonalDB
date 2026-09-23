import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB body limit — too small for the Split
    // Bill receipt photo (extractReceipt), which client-side already
    // downscales before sending but a safety margin still helps. Kept
    // under Vercel's own ~4.5MB platform request-size ceiling.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
