import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import VideoDetailGallery from "@/components/works/VideoDetailGallery";
import WorkVideoPlayer from "@/components/works/WorkVideoPlayer";
import { getWorkWithRelated } from "@/features/portfolio/data/works-store";
import { fetchWorksIndexFromCos } from "@/features/portfolio/data/works-store";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { getWorkDisplayTitle } from "@/features/portfolio/utils/work-display-title";
import { getMessages } from "@/i18n/messages";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";
import { isLocale } from "@/lib/i18n";

export const revalidate = 3600;

// build 时从 COS index 预生成全部 slug x locale 的静态详情页;
// index 不可用(COS 故障/本地无凭据)时回退为空 → 按需 ISR,不阻断 build。
export async function generateStaticParams() {
  const index = await fetchWorksIndexFromCos();
  if (!index) {
    return [];
  }
  return SUPPORTED_LOCALES.flatMap((locale) =>
    index.slugs.map((slug) => ({ locale, slug })),
  );
}

type WorkDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: WorkDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const messages = getMessages(locale);
  const { work } = await getWorkWithRelated(slug);
  if (!work) {
    return buildPageMetadata({
      locale,
      path: `/works/${slug}`,
      title: locale === "zh" ? "作品未找到｜高欣明作品集" : "Work Not Found | Gao Xinming Portfolio",
      description:
        locale === "zh"
          ? "高欣明新媒体运营、AIGC内容增长与视频摄影作品集。"
          : "Gao Xinming's portfolio for new media operations, AIGC content growth, and visual production.",
    });
  }

  const displayTitle = getWorkDisplayTitle(work, locale, messages);
  return buildPageMetadata({
    locale,
    path: `/works/${slug}`,
    title:
      locale === "zh"
        ? `${displayTitle}｜高欣明新媒体运营与AIGC作品集`
        : `${displayTitle} | Gao Xinming AIGC and New Media Portfolio`,
    description: truncateDescription(
      work.description ||
        (locale === "zh"
          ? "高欣明新媒体运营、AIGC内容增长、短视频运营与视觉拍摄作品案例。"
          : "A Gao Xinming case across new media operations, AIGC content growth, short-video strategy, and visual production."),
    ),
  });
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const { work, related } = await getWorkWithRelated(slug);
  if (!work) {
    notFound();
  }
  const displayTitle = getWorkDisplayTitle(work, locale, messages);

  return (
    <main className="section">
      <div className="container detail-wrap">
        <div className="detail-top">
          <Link href={`/${locale}`} className="work-link">
            {messages.detail.back}
          </Link>
        </div>
        <h1 className="detail-title">{displayTitle}</h1>
        {work.category === "photo" && work.subtitle ? (
          <p className="detail-subtitle">{work.subtitle}</p>
        ) : null}
        {work.category === "article" && work.subtitle ? (
          <p className="detail-subtitle">{work.subtitle}</p>
        ) : null}

        {work.category === "article" ? (
          work.coverImage ? (
            <div className="detail-media detail-media--photo">
              <Image
                src={work.coverImage}
                alt={work.title}
                width={800}
                height={450}
                sizes="(max-width: 900px) 100vw, 80vw"
              />
            </div>
          ) : null
        ) : (
          <div
            className={
              work.category === "video"
                ? "detail-media detail-media--video"
                : "detail-media detail-media--photo"
            }
          >
            {work.category === "video" ? (
              <WorkVideoPlayer
                src={work.mediaUrl}
                srcOriginal={work.mediaUrlOriginal}
                poster={work.coverImage}
                unavailableLabel={messages.detail.videoUnavailable}
                processingLabel={messages.detail.videoProcessing}
                switchToOriginalLabel={messages.detail.qualitySwitchToOriginal}
                switchToLowLabel={messages.detail.qualitySwitchToLow}
              />
            ) : (
              <Image
                src={work.mediaUrl}
                alt={displayTitle}
                width={800}
                height={1000}
                sizes="(max-width: 900px) 100vw, 80vw"
              />
            )}
          </div>
        )}

        <p className="detail-desc">{work.description}</p>
        <div className="section-divider" />

        {work.category === "video" && work.detailImages && work.detailImages.length > 0 ? (
          <VideoDetailGallery images={work.detailImages} altPrefix={displayTitle} />
        ) : null}

        {work.category === "photo" && work.detailImages && work.detailImages.length > 0 ? (
          <div className="detail-gallery">
            {work.detailImages.map((src, index) => (
              <div className="detail-gallery-item" key={`${src}-${index}`}>
                <Image
                  src={src}
                  alt={`${displayTitle} ${index + 1}`}
                  width={900}
                  height={600}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="detail-meta">
          <p>
            <strong>{messages.detail.role}:</strong> {work.role}
          </p>
          <p>
            <strong>{messages.detail.year}:</strong> {work.year}
          </p>
          <p>
            <strong>{messages.detail.platform}:</strong> {work.platform}
          </p>
        </div>

        {work.externalUrl ? (
          <a href={work.externalUrl} target="_blank" rel="noopener noreferrer" className="work-link">
            {messages.contact.openLink}
          </a>
        ) : null}

        <section className="related">
          <div className="section-divider" />
          <h2 className="section-title">{messages.works.relatedTitle}</h2>
          <div className="cards">
            {related.map((item) => (
              <article className="info-card" key={item.slug}>
                <h3>{getWorkDisplayTitle(item, locale, messages)}</h3>
                <p>{item.subtitle}</p>
                <Link href={`/${locale}/works/${item.slug}`} className="work-link">
                  {messages.works.openDetail}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

