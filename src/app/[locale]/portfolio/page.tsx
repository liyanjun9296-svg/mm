import { Suspense } from "react";
import { notFound } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import RevealText from "@/components/motion/RevealText";
import PortfolioHubClient from "@/components/sections/PortfolioHubClient";
import { getPhotoCategories, getVideoCategories } from "@/features/portfolio/data/categories-store";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

export const revalidate = 300;

type PortfolioPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);
  const [works, videoCategories, photoCategories] = await Promise.all([
    getWorks(),
    getVideoCategories(),
    getPhotoCategories(),
  ]);

  return (
    <main className="portfolio-hub-page">
      <div className="container">
        <SectionHeader index="01" title={<RevealText text={messages.works.sectionTitle} />} />
        <Suspense fallback={<p className="admin-desc">加载中…</p>}>
          <PortfolioHubClient
            works={works}
            videoCategories={videoCategories}
            photoCategories={photoCategories}
            messages={messages}
            locale={locale as Locale}
          />
        </Suspense>
      </div>
    </main>
  );
}
