import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionHeader from "@/components/ui/SectionHeader";
import RevealText from "@/components/motion/RevealText";
import PortfolioHubClient from "@/components/sections/PortfolioHubClient";
import { getPhotoCategories, getVideoCategories } from "@/features/portfolio/data/categories-store";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { buildPageMetadata } from "@/lib/seo";
import { isLocale, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

// SSG：build 时预生成 /zh/portfolio 和 /en/portfolio
// 后台保存作品后 revalidatePath("/zh/portfolio") + revalidatePath("/en/portfolio") 主动重建
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

type PortfolioPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return buildPageMetadata({
    locale,
    path: "/portfolio",
    title:
      locale === "zh"
        ? "精选作品｜高欣明新媒体运营与AIGC作品集"
        : "Selected Works | Gao Xinming AIGC and New Media Portfolio",
    description:
      locale === "zh"
        ? "浏览高欣明的新媒体运营、AIGC内容增长、短视频运营、视觉拍摄、摄影与商业转化作品案例。"
        : "Explore Gao Xinming's work across new media operations, AIGC content growth, short-video strategy, visual production, photography, and conversion-focused cases.",
  });
}

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
