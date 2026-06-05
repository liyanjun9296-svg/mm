import { notFound } from "next/navigation";
import AboutSection from "@/components/sections/AboutSection";
import CapabilitiesSection from "@/components/sections/CapabilitiesSection";
import ContactSection from "@/components/sections/ContactSection";
import HeroSection from "@/components/sections/HeroSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import ViralHitsSection from "@/components/sections/ViralHitsSection";
import { resolveHeroDisplayFont } from "@/config/hero-display-font";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

// 5 分钟 ISR:首页 SSR 结果在 Vercel 边缘缓存,
// 同一 locale 重复访问 / 切语言不再每次都重新 fetch COS。
// 后台保存作品时通过 revalidatePath 主动失效。
export const revalidate = 300;

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ heroFont?: string }>;
};

export default async function LocaleHomePage({ params, searchParams }: LocaleHomePageProps) {
  const { locale } = await params;
  const { heroFont } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);
  const works = await getWorks();
  const displayFont = resolveHeroDisplayFont(heroFont);

  return (
    <main id="home">
      <HeroSection messages={messages} locale={locale as Locale} displayFont={displayFont} />
      <CapabilitiesSection messages={messages} />
      <PortfolioSection works={works} messages={messages} locale={locale as Locale} />
      <ViralHitsSection messages={messages} locale={locale as Locale} />
      <AboutSection messages={messages} locale={locale as Locale} />
      <ContactSection messages={messages} locale={locale as Locale} />
    </main>
  );
}
