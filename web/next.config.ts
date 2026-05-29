import type { NextConfig } from "next";

// Хост Directus для next/image (ассеты /assets/:id). Прод — через NEXT_PUBLIC_DIRECTUS_URL.
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? process.env.DIRECTUS_URL ?? "http://localhost:8055";
const { protocol, hostname, port } = new URL(directusUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port: port || undefined,
        pathname: "/assets/**",
      },
    ],
  },
};

export default nextConfig;
