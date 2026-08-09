import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The newsletter used to live at /brief; issues already sent link there.
  async redirects() {
    return [
      { source: "/brief", destination: "/newsletter", permanent: true },
      {
        source: "/brief/:path*",
        destination: "/newsletter/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
