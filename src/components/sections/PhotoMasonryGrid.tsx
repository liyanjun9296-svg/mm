"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WorkItem } from "@/features/portfolio/types";
import { cosOptimizedImageUrl } from "@/lib/cos/image-url";

const PHOTO_MASONRY_SIZES = "(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw";

type FrameVariant = "portrait" | "landscape";

/** 用于最短列分配的高度权重（与 aspect-ratio 对应） */
const VARIANT_WEIGHT: Record<FrameVariant, number> = {
  portrait: 1.25,
  landscape: 0.82,
};

type MasonryCell = {
  work: WorkItem;
  variant: FrameVariant;
};

function frameVariantForIndex(index: number): FrameVariant {
  // 约每 5 张插入一张横版，形成类似线稿中列间错落
  return index % 5 === 2 ? "landscape" : "portrait";
}

function buildColumns(works: WorkItem[], columnCount: number): MasonryCell[][] {
  const columns: MasonryCell[][] = Array.from({ length: columnCount }, () => []);
  const heights = Array.from({ length: columnCount }, () => 0);

  works.forEach((work, index) => {
    const variant = frameVariantForIndex(index);
    const target = heights.indexOf(Math.min(...heights));
    columns[target].push({ work, variant });
    heights[target] += VARIANT_WEIGHT[variant];
  });

  return columns;
}

function getColumnCount(viewportWidth: number): number {
  if (viewportWidth <= 640) {
    return 1;
  }
  if (viewportWidth <= 1200) {
    return 2;
  }
  return 3;
}

type PhotoMasonryGridProps = {
  works: WorkItem[];
  locale: string;
};

export default function PhotoMasonryGrid({ works, locale }: PhotoMasonryGridProps) {
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const update = () => setColumnCount(getColumnCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const columns = useMemo(
    () => buildColumns(works, columnCount),
    [works, columnCount],
  );

  return (
    <div className="photo-masonry-columns">
      {columns.map((column, colIndex) => (
        <div className="photo-masonry-col" key={`col-${colIndex}`}>
          {column.map(({ work, variant }) => (
            <Link
              key={work.slug}
              href={`/${locale}/works/${work.slug}`}
              className="photo-masonry-item"
            >
              <div className={`photo-masonry-frame photo-masonry-frame--${variant}`}>
                <Image
                  src={cosOptimizedImageUrl(work.coverImage, "grid")}
                  alt={work.title}
                  fill
                  className="photo-masonry-img"
                  sizes={PHOTO_MASONRY_SIZES}
                />
              </div>
              <div className="photo-masonry-caption">
                <p className="photo-masonry-caption-title">{work.title}</p>
                {work.subtitle ? (
                  <p className="photo-masonry-caption-sub">{work.subtitle}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
