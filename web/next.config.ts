import type { NextConfig } from "next";

// Хост Directus для next/image (ассеты /assets/:id). Прод — через NEXT_PUBLIC_DIRECTUS_URL.
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? process.env.DIRECTUS_URL ?? "http://localhost:8055";
const { protocol, hostname, port } = new URL(directusUrl);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone", // для Docker-образа (минимальный рантайм)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port: port || undefined,
        pathname: "/assets/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
