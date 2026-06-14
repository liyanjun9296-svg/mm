import { notFound } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import RevealText from "@/components/motion/RevealText";
import PortfolioHubClient from "@/components/sections/PortfolioHubClient";
import { getPhotoCategories, getVideoCategories } from "@/features/portfolio/data/categories-store";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

// SSG：build 时预生成 /zh/portfolio 和 /en/portfolio
// 后台保存作品后 revalidatePath("/zh/portfolio") + revalidatePath("/en/portfolio") 主动重建
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

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
        <PortfolioHubClient
          works={works}
          videoCategories={videoCategories}
          photoCategories={photoCategories}
          messages={messages}
          locale={locale as Locale}
        />
      </div>
    </main>
  );
}
