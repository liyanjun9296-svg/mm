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
    // 防 5/31 流量爆量主因:Vercel 默认 minimumCacheTTL 仅 60 秒,
    // 同一张图反复访问/反复 redeploy 会不断回源 COS。
    // 媒体路径已 slug 化(workMediaKey)、内容不变 → 1 年 immutable 安全。
    minimumCacheTTL: 31536000,
    // 收窄变体数:默认 deviceSizes(8 档) + imageSizes(8 档) = 单图最多 16 变体
    // → 每个新变体首访都回源 COS 拉原图。砍到 3+3 仍覆盖主流屏幕,视觉无差。
    deviceSizes: [640, 1080, 1920],
    imageSizes: [160, 320, 640],
    localPatterns: [
      { pathname: "/images/**" },
      // dev 本地快照：/api/dev/media?key=works/...（search 省略 = 允许任意 query）
      { pathname: "/api/dev/media" },
    ],
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
