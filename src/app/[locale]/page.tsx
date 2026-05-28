import { notFound } from "next/navigation";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import HeroSection from "@/components/sections/HeroSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import { works } from "@/features/portfolio/data/works";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/lib/i18n";

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);

  return (
    <main id="home">
      <HeroSection messages={messages} />
      <PortfolioSection works={works} messages={messages} locale={locale as Locale} />
      <AboutSection messages={messages} locale={locale as Locale} />
      <ContactSection messages={messages} />
    </main>
  );
}

