import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutSection from "@/components/sections/AboutSection";
import CapabilitiesSection from "@/components/sections/CapabilitiesSection";
import ContactSection from "@/components/sections/ContactSection";
import HeroSection from "@/components/sections/HeroSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import PortfolioSectionShell from "@/components/sections/PortfolioSectionShell";
import ViralHitsSection from "@/components/sections/ViralHitsSection";
import { resolveHeroDisplayFont } from "@/config/hero-display-font";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getContactPlatforms, getProfile } from "@/features/profile/data/profile";
import { getMessages } from "@/i18n/messages";
import { absoluteUrl, buildPageMetadata, getHomeSeo } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

// 1 小时 ISR：后台保存作品时通过 revalidateTag 主动失效，无需频繁轮询
export const revalidate = 3600;

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ heroFont?: string }>;
};

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const seo = getHomeSeo(locale);
  return buildPageMetadata({
    locale,
    title: seo.title,
    description: seo.description,
  });
}

export default async function LocaleHomePage({ params, searchParams }: LocaleHomePageProps) {
  const { locale } = await params;
  const { heroFont } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const messages = getMessages(typedLocale);
  const profile = getProfile(typedLocale);
  const platforms = getContactPlatforms(typedLocale);
  const displayFont = resolveHeroDisplayFont(heroFont);
  const works = await getWorks();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.title,
      description: typedLocale === "zh" ? profile.bioZh : profile.bioEn,
      address: {
        "@type": "PostalAddress",
        addressLocality: typedLocale === "zh" ? "北京" : "Beijing",
        addressCountry: typedLocale === "zh" ? "中国" : "China",
      },
      url: absoluteUrl(`/${typedLocale}`),
      sameAs: platforms.map((platform) => platform.url),
      knowsAbout: [
        "新媒体运营",
        "AIGC",
        "AIGC内容增长",
        "短视频运营",
        "矩阵运营",
        "内容增长",
        "视频摄影",
        "New media operations",
        "AIGC workflow",
        "Content growth",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: messages.siteTitle,
      description: messages.siteDescription,
      url: absoluteUrl(`/${typedLocale}`),
      inLanguage: typedLocale === "zh" ? "zh-CN" : "en",
    },
  ];

  return (
    <main id="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection messages={messages} locale={typedLocale} displayFont={displayFont} />
      <CapabilitiesSection messages={messages} />
      <PortfolioSectionShell messages={messages} locale={typedLocale}>
        <PortfolioSection works={works} messages={messages} locale={typedLocale} />
      </PortfolioSectionShell>
      <ViralHitsSection messages={messages} locale={typedLocale} />
      <AboutSection messages={messages} locale={typedLocale} />
      <ContactSection messages={messages} locale={typedLocale} />
    </main>
  );
}
