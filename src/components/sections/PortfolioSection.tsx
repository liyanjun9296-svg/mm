import Link from "next/link";
import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { resolveFeaturedWorks } from "@/features/portfolio/utils/resolveFeaturedWorks";
import { cosOptimizedImageUrl } from "@/lib/cos/image-url";
import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type PortfolioSectionProps = {
  works: WorkItem[];
  messages: Messages;
  locale: Locale;
};

function FeaturedCard({
  work,
  layout,
  locale,
  messages,
}: {
  work: WorkItem;
  layout: "large" | "compact";
  locale: Locale;
  messages: Messages;
}) {
  const thumbHeight = layout === "large" ? 260 : 200;

  return (
    <RevealOnScroll>
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
            alt={work.title}
            className="featured-card-img"
            width={800}
            height={450}
          />
        </div>
        <div className="featured-card-info">
          <p className="featured-card-title">{work.title}</p>
          <span className="featured-card-tag">
            {work.category === "video"
              ? messages.portfolio.tagVideo
              : work.category === "photo"
                ? messages.portfolio.tagPhoto
                : messages.portfolio.tagArticle}
          </span>
        </div>
      </Link>
    </RevealOnScroll>
  );
}

export default function PortfolioSection({ works, messages, locale }: PortfolioSectionProps) {
  const { large, compact, usingFallback } = resolveFeaturedWorks(works);
  const hasFeaturedCards = large.length > 0 || compact.length > 0;

  return (
    <section id="works" className="section portfolio-featured-section">
      <div className="container">
        <SectionHeader
          index="01"
          title={messages.works.sectionTitle}
          right={
            <Link href={`/${locale}/portfolio`} className="section-header-link">
              {messages.portfolio.allProjects} →
            </Link>
          }
        />

        {large.length > 0 ? (
          <div className="featured-row featured-row--large">
            {large.map((work) => (
              <FeaturedCard
                key={work.slug}
                work={work}
                layout="large"
                locale={locale}
                messages={messages}
              />
            ))}
          </div>
        ) : null}

        {compact.length > 0 ? (
          <div className="featured-row featured-row--compact">
            {compact.map((work) => (
              <FeaturedCard
                key={work.slug}
                work={work}
                layout="compact"
                locale={locale}
                messages={messages}
              />
            ))}
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

        <div className="portfolio-explore-wrap">
          <Link href={`/${locale}/portfolio`} className="portfolio-explore-link hover-link">
            {messages.portfolio.exploreAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
