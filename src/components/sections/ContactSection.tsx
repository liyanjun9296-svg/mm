import ContactSectionClient from "@/components/sections/ContactSectionClient";
import { getContactPlatforms } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type ContactSectionProps = {
  messages: Messages;
  locale: Locale;
};

export default function ContactSection({ messages, locale }: ContactSectionProps) {
  const platforms = getContactPlatforms(locale);
  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <ContactSectionClient messages={messages} platforms={platforms} />
      </div>
    </section>
  );
}
