"use client";

import Image from "next/image";

type VideoDetailGalleryProps = {
  images: string[];
  altPrefix: string;
};

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function VideoDetailGallery({ images, altPrefix }: VideoDetailGalleryProps) {
  return (
    <div className="detail-gallery detail-gallery--video detail-gallery--seamless">
      {images.map((src, index) =>
        isVideoUrl(src) ? (
          <video
            key={`${src}-${index}`}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="detail-gallery-seamless-item"
          />
        ) : (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt={`${altPrefix} ${index + 1}`}
            width={1200}
            height={800}
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="detail-gallery-seamless-item"
          />
        ),
      )}
    </div>
  );
}
