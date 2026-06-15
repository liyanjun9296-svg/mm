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
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

// 1 小时 ISR：后台保存作品时通过 revalidateTag 主动失效，无需频繁轮询
export const revalidate = 3600;

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
  const displayFont = resolveHeroDisplayFont(heroFont);
  const works = await getWorks();

  return (
    <main id="home">
      <HeroSection messages={messages} locale={locale as Locale} displayFont={displayFont} />
      <CapabilitiesSection messages={messages} />
      <PortfolioSectionShell messages={messages} locale={locale as Locale}>
        <PortfolioSection works={works} messages={messages} locale={locale as Locale} />
      </PortfolioSectionShell>
      <ViralHitsSection messages={messages} locale={locale as Locale} />
      <AboutSection messages={messages} locale={locale as Locale} />
      <ContactSection messages={messages} locale={locale as Locale} />
    </main>
  );
}
