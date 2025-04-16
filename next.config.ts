import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "example.com",
      "oaidalleapiprodscus.blob.core.windows.net",
      "text-to-sth.s3.ap-northeast-2.amazonaws.com",
    ],
  },
};

export default nextConfig;
