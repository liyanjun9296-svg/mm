import { notFound } from "next/navigation";
import AboutSection from "@/components/sections/AboutSection";
import CapabilitiesSection from "@/components/sections/CapabilitiesSection";
import ContactSection from "@/components/sections/ContactSection";
import HeroSection from "@/components/sections/HeroSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import { resolveHeroDisplayFont } from "@/config/hero-display-font";
import { getWorks } from "@/features/portfolio/data/works-store";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

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
      <AboutSection messages={messages} locale={locale as Locale} />
      <ContactSection messages={messages} />
    </main>
  );
}
