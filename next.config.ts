import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["example.com", "gravatar.com", "s3.amazonaws.com"],
  },
};

export default nextConfig;
