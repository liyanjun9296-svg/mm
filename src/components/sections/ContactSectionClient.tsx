"use client";

import { useState } from "react";
import MagneticButton from "@/components/motion/MagneticButton";
import ContactModal from "@/components/ui/ContactModal";
import type { ContactPlatform } from "@/features/profile/data/profile";
import { contactInfo } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";

type ContactSectionClientProps = {
  messages: Messages;
  platforms: ContactPlatform[];
};

export default function ContactSectionClient({
  messages,
  platforms,
}: ContactSectionClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { contact: t } = messages;

  return (
    <>
      <div className="contact-main">
        <div className="contact-cta-block">
          <h2 className="contact-headline">{t.headline}</h2>
          <MagneticButton
            className="btn-primary contact-cta"
            onClick={() => setModalOpen(true)}
          >
            {t.cta}
          </MagneticButton>
        </div>

        <div className="contact-platforms">
          <p className="contact-platforms-label">{t.platformsLabel}</p>
          <div className="contact-platform-list">
            {platforms.map((platform, index) => (
              <div key={platform.index}>
                {index > 0 ? <div className="contact-platform-divider" aria-hidden="true" /> : null}
                <a
                  className="contact-platform-row hover-row"
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="contact-platform-left">
                    <span className="contact-platform-index">{platform.index}</span>
                    <div>
                      <h3 className="contact-platform-name">{platform.name}</h3>
                      <p className="contact-platform-note">{platform.note}</p>
                    </div>
                  </div>
                  <span className="contact-platform-arrow">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="contact-site-footer">
        <p>{messages.footer.copyright}</p>
        <p>{messages.footer.brand}</p>
      </footer>

      <ContactModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        messages={messages}
        contactInfo={contactInfo}
      />
    </>
  );
}
