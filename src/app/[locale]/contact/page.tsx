import { notFound } from "next/navigation";
import ContactPageClient from "./ContactPageClient";
import { getMessages } from "@/i18n/messages";
import { getContactPlatforms } from "@/features/profile/data/profile";
import { isLocale, type Locale } from "@/lib/i18n";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

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
