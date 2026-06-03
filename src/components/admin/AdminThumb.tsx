"use client";

import Image from "next/image";
import { useState } from "react";
import { mediaVariantUrl } from "@/lib/cos/media-variants";

type AdminThumbProps = {
  src: string;
  size: number;
  className?: string;
};

export default function AdminThumb({ src, size, className }: AdminThumbProps) {
  const [failed, setFailed] = useState(false);

  if (!src?.trim()) {
    return <span className={`admin-works-thumb admin-works-thumb--empty ${className ?? ""}`} aria-hidden />;
  }

  const thumbSrc = failed ? src : mediaVariantUrl(src, "admin");

  return (
    <Image
      src={thumbSrc}
      alt=""
      width={size}
      height={size}
      className={className ?? "admin-works-thumb"}
      unoptimized
      onError={() => {
        if (!failed) {
          setFailed(true);
        }
      }}
    />
  );
}
