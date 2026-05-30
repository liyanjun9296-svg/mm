import RevealOnScroll from "@/components/motion/RevealOnScroll";
import TiltCard from "@/components/motion/TiltCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { socialLinks } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";

type ContactSectionProps = {
  messages: Messages;
};

export default function ContactSection({ messages }: ContactSectionProps) {
  return (
    <section id="contact" className="section">
      <div className="container">
        <SectionHeader index="03" title={messages.contact.sectionTitle} />

        <div className="contact-grid">
          <div className="contact-left">
            <p className="mono-label">{messages.contact.sectionDesc}</p>
          </div>
          <div className="contact-right">
            <p className="mono-label">SOCIAL PLATFORMS</p>
            <div className="section-divider" />
            {socialLinks.map((item) => (
              <RevealOnScroll key={item.name}>
                <a className="contact-row hover-row" href={item.url} target="_blank" rel="noopener noreferrer">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.note}</p>
                  </div>
                  <span className="contact-arrow">↗</span>
                </a>
                <div className="section-divider" />
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <div className="cards contact-cards-fallback">
          {socialLinks.map((item) => (
            <RevealOnScroll key={item.name}>
              <TiltCard className="info-card">
                <h3>{item.name}</h3>
                <p>{item.note}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="work-link hover-link">
                  {messages.contact.openLink}
                </a>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
