"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import FeaturedWorkCard from "@/components/sections/FeaturedWorkCard";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type FeaturedCompactCarouselProps = {
  works: WorkItem[];
  locale: Locale;
  messages: Messages;
};

/** 半轨滚动像素速度，各断点体感一致 */
const PIXELS_PER_SECOND = 25;
const MIN_DURATION_SECONDS = 24;

export default function FeaturedCompactCarousel({
  works,
  locale,
  messages,
}: FeaturedCompactCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [durationSeconds, setDurationSeconds] = useState(
    Math.max(works.length * 10, MIN_DURATION_SECONDS),
  );

  const shouldScroll = works.length > 1;
  const loopWorks = shouldScroll ? [...works, ...works] : works;

  useEffect(() => {
    if (!shouldScroll) {
      return;
    }

    const track = trackRef.current;
    if (!track) {
      return;
    }

    function updateDuration() {
      const halfWidth = track!.scrollWidth / 2;
      if (halfWidth <= 0) {
        return;
      }
      setDurationSeconds(Math.max(halfWidth / PIXELS_PER_SECOND, MIN_DURATION_SECONDS));
    }

    updateDuration();

    const observer = new ResizeObserver(updateDuration);
    observer.observe(track);

    return () => observer.disconnect();
  }, [shouldScroll, works]);

  return (
    <div
      className={`featured-carousel${shouldScroll ? "" : " featured-carousel--static"}`}
      style={
        shouldScroll
          ? ({ "--carousel-duration": `${durationSeconds}s` } as CSSProperties)
          : undefined
      }
    >
      <div className="featured-carousel-viewport">
        <div className="featured-carousel-track" ref={trackRef}>
          {loopWorks.map((work, index) => (
            <div
              className="featured-carousel-item"
              key={`${work.slug}-${index}`}
              aria-hidden={shouldScroll && index >= works.length ? true : undefined}
            >
              <FeaturedWorkCard
                work={work}
                layout="compact"
                locale={locale}
                messages={messages}
                reveal={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
