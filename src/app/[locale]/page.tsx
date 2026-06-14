import { Suspense } from "react";
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

// 1 小时 ISR：后台保存作品时通过 revalidateTag 主动失效，无需频繁轮询
export const revalidate = 3600;

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ heroFont?: string }>;
};

// async wrapper，让 COS 请求不阻塞 Hero/Capabilities 的 HTML shell 返回
async function PortfolioAsync({ messages, locale }: { messages: ReturnType<typeof getMessages>; locale: Locale }) {
  const works = await getWorks();
  return <PortfolioSection works={works} messages={messages} locale={locale} />;
}

// Portfolio 骨架屏：section 高度占位，shimmer 动画
function PortfolioSkeleton() {
  return (
    <section className="section" aria-hidden="true">
      <div className="container">
        <div className="skeleton" style={{ width: 160, height: 20, marginBottom: 32 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 16 }}>
          <div className="skeleton" style={{ aspectRatio: "16/9" }} />
          <div className="skeleton" style={{ aspectRatio: "16/9" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "4/3" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function LocaleHomePage({ params, searchParams }: LocaleHomePageProps) {
  const { locale } = await params;
  const { heroFont } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);
  const displayFont = resolveHeroDisplayFont(heroFont);

  return (
    <main id="home">
      <HeroSection messages={messages} locale={locale as Locale} displayFont={displayFont} />
      <CapabilitiesSection messages={messages} />
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioAsync messages={messages} locale={locale as Locale} />
      </Suspense>
      <ViralHitsSection messages={messages} locale={locale as Locale} />
      <AboutSection messages={messages} locale={locale as Locale} />
      <ContactSection messages={messages} locale={locale as Locale} />
    </main>
  );
}
