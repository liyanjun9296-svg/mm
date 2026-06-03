import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import VideoDetailGallery from "@/components/works/VideoDetailGallery";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getWorkBySlug } from "@/features/portfolio/utils/filterWorks";
import { getWorkDisplayTitle } from "@/features/portfolio/utils/work-display-title";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/lib/i18n";

type WorkDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const works = await getWorks();
  const work = getWorkBySlug(works, slug);
  if (!work) {
    notFound();
  }

  const related = works.filter((item) => item.slug !== work.slug).slice(0, 2);
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
        <p className="detail-desc">{work.description}</p>
        <div className="section-divider" />

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
              <video controls preload="metadata" src={work.mediaUrl} />
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

