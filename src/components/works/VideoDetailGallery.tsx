"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

type VideoDetailGalleryProps = {
  images: string[];
  altPrefix: string;
};

type GalleryItem = { src: string; index: number };

type Segment =
  | { type: "landscape-grid"; items: GalleryItem[] }
  | { type: "portrait-grid"; items: GalleryItem[] };

function buildSegments(
  images: string[],
  dimensions: Record<number, { w: number; h: number }>,
): Segment[] | null {
  for (let i = 0; i < images.length; i++) {
    if (!dimensions[i]) {
      return null;
    }
  }

  const segments: Segment[] = [];
  let current: Segment | null = null;

  for (let i = 0; i < images.length; i++) {
    const dim = dimensions[i]!;
    const type = dim.w >= dim.h ? "landscape-grid" : "portrait-grid";
    const item = { src: images[i]!, index: i };

    if (current && current.type === type) {
      current.items.push(item);
    } else {
      const nextSegment: Segment = { type, items: [item] };
      current = nextSegment;
      segments.push(nextSegment);
    }
  }

  return segments;
}

function GalleryImage({
  src,
  index,
  altPrefix,
  sizes,
  onDimensions,
}: {
  src: string;
  index: number;
  altPrefix: string;
  sizes: string;
  onDimensions: (index: number, w: number, h: number) => void;
}) {
  return (
    <div className="detail-gallery-grid-item">
      <Image
        src={src}
        alt={`${altPrefix} ${index + 1}`}
        width={1200}
        height={800}
        sizes={sizes}
        onLoad={(event) => {
          const img = event.currentTarget;
          onDimensions(index, img.naturalWidth, img.naturalHeight);
        }}
      />
    </div>
  );
}

export default function VideoDetailGallery({ images, altPrefix }: VideoDetailGalleryProps) {
  const [dimensions, setDimensions] = useState<Record<number, { w: number; h: number }>>({});

  const handleDimensions = useCallback((index: number, w: number, h: number) => {
    setDimensions((prev) => {
      const existing = prev[index];
      if (existing?.w === w && existing?.h === h) {
        return prev;
      }
      return { ...prev, [index]: { w, h } };
    });
  }, []);

  const segments = useMemo(
    () => buildSegments(images, dimensions),
    [images, dimensions],
  );

  if (!segments) {
    return (
      <div className="detail-gallery detail-gallery--video">
        <div className="detail-gallery-grid detail-gallery-grid--landscape">
          {images.map((src, index) => (
            <GalleryImage
              key={`${src}-${index}`}
              src={src}
              index={index}
              altPrefix={altPrefix}
              sizes="(max-width: 900px) 45vw, 600px"
              onDimensions={handleDimensions}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-gallery detail-gallery--video">
      {segments.map((segment, segmentIndex) => (
        <div
          key={`segment-${segmentIndex}`}
          className={`detail-gallery-grid detail-gallery-grid--${
            segment.type === "landscape-grid" ? "landscape" : "portrait"
          }`}
        >
          {segment.items.map(({ src, index }) => (
            <GalleryImage
              key={`${src}-${index}`}
              src={src}
              index={index}
              altPrefix={altPrefix}
              sizes={
                segment.type === "landscape-grid"
                  ? "(max-width: 900px) 45vw, 600px"
                  : "(max-width: 900px) 30vw, 400px"
              }
              onDimensions={handleDimensions}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
