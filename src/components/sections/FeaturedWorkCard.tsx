import Link from "next/link";
import Image from "next/image";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import FeaturedVideoCard from "@/components/sections/FeaturedVideoCard";
import { getWorkDisplayTitle } from "@/features/portfolio/utils/work-display-title";
import { cosOptimizedImageUrl } from "@/lib/cos/image-url";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type FeaturedWorkCardProps = {
  work: WorkItem;
  layout: "large" | "compact";
  locale: Locale;
  messages: Messages;
  reveal?: boolean;
};

export default function FeaturedWorkCard({
  work,
  layout,
  locale,
  messages,
  reveal = true,
}: FeaturedWorkCardProps) {
  if (work.category === "video") {
    return (
      <FeaturedVideoCard work={work} layout={layout} locale={locale} messages={messages} />
    );
  }

  const thumbHeight = layout === "large" ? 260 : 200;
  const displayTitle = getWorkDisplayTitle(work, locale, messages);

  const card = (
    <Link
      href={`/${locale}/works/${work.slug}`}
      className={`featured-card featured-card--${layout}`}
    >
      <div className="featured-card-thumb" style={{ height: thumbHeight }}>
        <Image
          src={
            work.category === "photo"
              ? cosOptimizedImageUrl(work.coverImage, "card")
              : work.coverImage
          }
          alt={displayTitle}
          className="featured-card-img"
          width={800}
          height={450}
        />
      </div>
      <div className="featured-card-info">
        <p className="featured-card-title">{displayTitle}</p>
        <span className="featured-card-tag">
          {work.category === "photo"
            ? messages.portfolio.tagPhoto
            : messages.portfolio.tagArticle}
        </span>
      </div>
    </Link>
  );

  if (!reveal) {
    return card;
  }

  return <RevealOnScroll>{card}</RevealOnScroll>;
}
