import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// 确保 next.config 能读到 .env.local 里的 COS_*（否则 next/image 白名单为空）
loadEnvConfig(process.cwd());

function buildCosRemotePatterns(): Array<{
  protocol: "https";
  hostname: string;
  pathname: string;
}> {
  const hostnames = new Set<string>();

  const candidates = [
    process.env.COS_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      hostnames.add(new URL(raw).hostname);
    } catch {
      // ignore invalid URL
    }
  }

  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (bucket && region) {
    hostnames.add(`${bucket}.cos.${region}.myqcloud.com`);
  }

  return [...hostnames].map((hostname) => ({
    protocol: "https" as const,
    hostname,
    pathname: "/**",
  }));
}

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shadcnstudio.com",
      },
      ...buildCosRemotePatterns(),
    ],
  },
};

export default nextConfig;
