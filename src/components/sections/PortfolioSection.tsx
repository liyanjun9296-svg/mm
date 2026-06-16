import Link from "next/link";
import FeaturedAigcVideoGrid from "@/components/sections/FeaturedAigcVideoGrid";
import FeaturedCompactCarousel from "@/components/sections/FeaturedCompactCarousel";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type PortfolioSectionProps = {
  works: WorkItem[];
  messages: Messages;
  locale: Locale;
};

export default function PortfolioSection({ works, messages, locale }: PortfolioSectionProps) {
  const photos = works.filter((work) => work.category === "photo").slice(0, 6);

  return (
    <>
      <div className="featured-block">
        <h3 className="featured-block-title">{messages.portfolio.featuredVideoTitle}</h3>
        <FeaturedAigcVideoGrid locale={locale} messages={messages} />
      </div>

      {photos.length > 0 ? (
        <div className="featured-block">
          <h3 className="featured-block-title">{messages.portfolio.featuredPhotoTitle}</h3>
          <Link
            href={`/${locale}/portfolio?tab=photo`}
            className="featured-photo-carousel-link"
            aria-label={messages.portfolio.hubPhoto}
            prefetch={false}
          >
            <FeaturedCompactCarousel
              works={photos}
              locale={locale}
              messages={messages}
              interactive={false}
            />
          </Link>
        </div>
      ) : null}
    </>
  );
}
