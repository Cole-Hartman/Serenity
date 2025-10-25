import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only 'position' is valid in newer Next versions
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
