"use client";

import type { CSSProperties } from "react";
import FeaturedWorkCard from "@/components/sections/FeaturedWorkCard";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type FeaturedCompactCarouselProps = {
  works: WorkItem[];
  locale: Locale;
  messages: Messages;
};

const SECONDS_PER_ITEM = 10;

export default function FeaturedCompactCarousel({
  works,
  locale,
  messages,
}: FeaturedCompactCarouselProps) {
  const shouldScroll = works.length > 1;
  const loopWorks = shouldScroll ? [...works, ...works] : works;
  const durationSeconds = works.length * SECONDS_PER_ITEM;

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
        <div className="featured-carousel-track">
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
