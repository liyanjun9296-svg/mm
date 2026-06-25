import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactPageClient from "./ContactPageClient";
import { getMessages } from "@/i18n/messages";
import { getContactPlatforms } from "@/features/profile/data/profile";
import { buildPageMetadata } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  return buildPageMetadata({
    locale,
    path: "/contact",
    title: locale === "zh" ? "联系高欣明｜新媒体运营与AIGC内容合作" : "Contact Gao Xinming | New Media and AIGC Collaboration",
    description:
      locale === "zh"
        ? "联系高欣明，沟通新媒体运营、AIGC内容增长、短视频矩阵运营、视觉拍摄与商业转化合作。"
        : "Contact Gao Xinming for new media operations, AIGC content growth, short-video matrix operations, visual production, and conversion-focused collaborations.",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);
  const platforms = getContactPlatforms(locale as Locale);

  return (
    <main style={{ paddingTop: 100 }}>
      <section id="contact" className="section contact-section">
        <div className="container">
          <ContactPageClient messages={messages} platforms={platforms} />
        </div>
      </section>
    </main>
  );
}
