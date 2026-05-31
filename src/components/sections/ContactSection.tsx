import ContactSectionClient from "@/components/sections/ContactSectionClient";
import { contactPlatforms } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";

type ContactSectionProps = {
  messages: Messages;
};

export default function ContactSection({ messages }: ContactSectionProps) {
  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <ContactSectionClient messages={messages} platforms={contactPlatforms} />
      </div>
    </section>
  );
}
