"use client";

import Image from "next/image";
import { useState } from "react";
import { mediaVariantUrl, type MediaVariant } from "@/lib/cos/media-variants";

type MediaVariantImageProps = {
  src: string;
  variant: MediaVariant;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
};

export default function MediaVariantImage({
  src,
  variant,
  alt,
  width,
  height,
  className,
  fill,
  sizes,
}: MediaVariantImageProps) {
  const [failed, setFailed] = useState(false);
  const displaySrc =
    failed || variant === "detail" ? src : mediaVariantUrl(src, variant);

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      sizes={sizes}
      unoptimized={variant === "admin"}
      onError={() => {
        if (!failed) {
          setFailed(true);
        }
      }}
    />
  );
}
