import { Suspense } from "react";
import { notFound } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import RevealText from "@/components/motion/RevealText";
import PortfolioHubClient from "@/components/sections/PortfolioHubClient";
import { getPhotoCategories, getVideoCategories } from "@/features/portfolio/data/categories-store";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";
import PortfolioLoading from "./loading";

export const revalidate = 3600;

type PortfolioPageProps = {
  params: Promise<{ locale: string }>;
};

// async wrapper，解除 COS 调用对 HTML shell 的阻塞
async function PortfolioAsync({ locale, messages }: { locale: Locale; messages: ReturnType<typeof getMessages> }) {
  const [works, videoCategories, photoCategories] = await Promise.all([
    getWorks(),
    getVideoCategories(),
    getPhotoCategories(),
  ]);
  return (
    <PortfolioHubClient
      works={works}
      videoCategories={videoCategories}
      photoCategories={photoCategories}
      messages={messages}
      locale={locale}
    />
  );
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);

  return (
    <main className="portfolio-hub-page">
      <div className="container">
        <SectionHeader index="01" title={<RevealText text={messages.works.sectionTitle} />} />
        <Suspense fallback={<PortfolioLoading bare />}>
          <PortfolioAsync locale={locale as Locale} messages={messages} />
        </Suspense>
      </div>
    </main>
  );
}
