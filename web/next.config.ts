import type { NextConfig } from "next";

// Хост Directus для next/image (ассеты /assets/:id). Прод — через NEXT_PUBLIC_DIRECTUS_URL.
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? process.env.DIRECTUS_URL ?? "http://localhost:8055";
const { protocol, hostname, port } = new URL(directusUrl);

// Next 16 блокирует оптимизацию изображений с приватных IP (localhost) — SSRF-защита.
// Разрешаем только когда Directus на локальном/приватном хосте (дев). Прод (cms.домен) остаётся заблокированным.
const isPrivateHost = (h: string) =>
  h === "localhost" ||
  h === "::1" ||
  /^127\./.test(h) ||
  /^0\.0\.0\.0$/.test(h) ||
  /^10\./.test(h) ||
  /^192\.168\./.test(h) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(h);

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
    dangerouslyAllowLocalIP: isPrivateHost(hostname),
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
