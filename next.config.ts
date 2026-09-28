import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two loaders resolve a path under public/ from a variable (the search-index
  // reader and the brief's image measurer), so Next's tracer gives up and packs
  // all of public/ into every function that touches them. With the brief adding
  // ~1 MB of art a day that crossed Vercel's 250 MB function limit on
  // 2026-09-20 and every deploy failed after it. Nothing reads an image or a
  // video at request time: issue pages are prerendered, and an unknown date
  // 404s before it measures anything.
  outputFileTracingExcludes: {
    "**/*": [
      "public/images/**",
      "public/videos/**",
      "public/*.png",
      "public/*.jpg",
      "public/*.pdf",
    ],
  },

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
