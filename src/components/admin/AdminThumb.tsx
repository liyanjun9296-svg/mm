"use client";

import Image from "next/image";
import { useState } from "react";
import { mediaVariantUrl, type MediaVariant } from "@/lib/cos/media-variants";

type AdminThumbProps = {
  src: string;
  size: number;
  className?: string;
};

const FALLBACK_CHAIN: MediaVariant[] = ["admin", "list", "detail"];

// dev 本地快照（/api/dev/media）下没有同步 .admin.webp / .list.webp 物理文件，
// 直接从 detail 起跳避免每张缩图触发两次 404。
function isDevSnapshotUrl(url: string): boolean {
  return url.startsWith("/api/dev/media");
}

export default function AdminThumb({ src, size, className }: AdminThumbProps) {
  const initialStage = isDevSnapshotUrl(src) ? FALLBACK_CHAIN.length - 1 : 0;
  const [stage, setStage] = useState(initialStage);
  const [prevSrc, setPrevSrc] = useState(src);
  // src 变化（例如重新上传后回填新 URL）→ 重置回起始档
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStage(initialStage);
  }

  if (!src?.trim()) {
    return (
      <span
        className={`admin-works-thumb admin-works-thumb--empty ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  const variant = FALLBACK_CHAIN[stage] ?? "detail";
  const thumbSrc = mediaVariantUrl(src, variant);

  return (
    <Image
      src={thumbSrc}
      alt=""
      width={size}
      height={size}
      className={className ?? "admin-works-thumb"}
      unoptimized
      onError={() => {
        if (stage < FALLBACK_CHAIN.length - 1) {
          console.warn(
            `[AdminThumb] ${variant} 档加载失败，回退到 ${FALLBACK_CHAIN[stage + 1]}: ${src}`,
          );
          setStage((s) => s + 1);
        }
      }}
    />
  );
}
