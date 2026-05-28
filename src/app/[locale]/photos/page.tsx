import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { works } from "@/features/portfolio/data/works";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";
import RevealOnScroll from "@/components/motion/RevealOnScroll";

type PhotosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PhotosPage({ params }: PhotosPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);
  const photos = works.filter((w) => w.category === "photo");

  return (
    <main className="photos-page">
      <div className="container">
        <div className="photos-page-head">
          <Link href={`/${locale}#works`} className="back-link hover-link">
            ← {messages.detail.back}
          </Link>
          <h1 className="photos-page-title">{messages.works.photo}</h1>
        </div>
        <div className="photos-masonry">
          {photos.map((work, i) => (
            <RevealOnScroll key={work.slug} delay={i * 80}>
              <Link href={`/${locale}/works/${work.slug}`} className="photos-masonry-item">
                <Image
                  src={work.coverImage}
                  alt={work.title}
                  className="photos-masonry-img"
                  width={800}
                  height={600}
                />
                <p className="photos-masonry-caption">{work.title}</p>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </main>
  );
}
