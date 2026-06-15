import FeaturedCompactCarousel from "@/components/sections/FeaturedCompactCarousel";
import FeaturedWorkCard from "@/components/sections/FeaturedWorkCard";
import { resolveFeaturedWorks } from "@/features/portfolio/utils/resolveFeaturedWorks";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type PortfolioSectionProps = {
  works: WorkItem[];
  messages: Messages;
  locale: Locale;
};

export default function PortfolioSection({ works, messages, locale }: PortfolioSectionProps) {
  const { large, compact, usingFallback } = resolveFeaturedWorks(works);
  const hasFeaturedCards = large.length > 0 || compact.length > 0;

  return (
    <>
      {large.length > 0 ? (
        <div className="featured-block">
          <h3 className="featured-block-title">{messages.portfolio.featuredVideoTitle}</h3>
          <div className="featured-row featured-row--large">
            {large.map((work) => (
              <FeaturedWorkCard
                key={work.slug}
                work={work}
                layout="large"
                locale={locale}
                messages={messages}
              />
            ))}
          </div>
        </div>
      ) : null}

      {compact.length > 0 ? (
        <div className="featured-block">
          <h3 className="featured-block-title">{messages.portfolio.featuredPhotoTitle}</h3>
          <FeaturedCompactCarousel works={compact} locale={locale} messages={messages} />
        </div>
      ) : null}

      {!hasFeaturedCards ? (
        <p className="portfolio-empty-hint">{messages.portfolio.emptyFeatured}</p>
      ) : null}
      {usingFallback ? (
        <p className="portfolio-empty-hint portfolio-empty-hint--muted">
          {messages.portfolio.featuredFallbackHint}
        </p>
      ) : null}
    </>
  );
}
