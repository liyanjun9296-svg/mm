import Link from "next/link";
import { getCases } from "@/features/profile/data/case-details";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type FeaturedAigcVideoGridProps = {
  locale: Locale;
  messages: Messages;
};

export default function FeaturedAigcVideoGrid({ locale, messages }: FeaturedAigcVideoGridProps) {
  const aigcCase = getCases(locale).find((item) => item.id === "aigc-system");
  const videoCards = aigcCase?.videoDirections ?? [];

  if (videoCards.length === 0) {
    return null;
  }

  return (
    <Link
      href={`/${locale}/portfolio?tab=video`}
      className="featured-aigc-video-link"
      aria-label={messages.portfolio.hubVideo}
      prefetch={false}
    >
      <div className="case-video-cards featured-aigc-video-grid">
        {videoCards.map((card) => (
          <article key={card.title} className="case-video-card featured-aigc-video-card">
            {card.videoUrl ? (
              <video
                className="case-video-card-video featured-aigc-video"
                src={card.videoUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="case-video-card-placeholder featured-aigc-video-placeholder">
                <span>{card.placeholder}</span>
              </div>
            )}
            <div className="case-video-card-text featured-aigc-video-text">
              <div className="featured-aigc-video-title-row">
                <h4>{card.title}</h4>
                <span>{messages.portfolio.tagVideo}</span>
              </div>
              <p>{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </Link>
  );
}
