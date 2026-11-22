const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export" } : {}),
  images: {
    ...(isStaticExport ? { unoptimized: true } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  ...(!isStaticExport
    ? {
        // Same-origin proxy to the MNIS API: first-party httpOnly refresh cookie, no CORS, no third-party-cookie issues.
        async rewrites() {
          return [{ source: "/v1/:path*", destination: `${API_URL}/v1/:path*` }];
        },
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
