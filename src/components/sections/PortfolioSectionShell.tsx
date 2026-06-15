import type { ReactNode } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import MagneticButton from "@/components/motion/MagneticButton";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type Props = {
  messages: Messages;
  locale: Locale;
  children: ReactNode;
};

export default function PortfolioSectionShell({ messages, locale, children }: Props) {
  return (
    <section id="works" className="section portfolio-featured-section">
      <div className="container">
        <SectionHeader
          index="01"
          title={messages.works.sectionTitle}
          right={
            <MagneticButton
              as="a"
              href={`/${locale}/portfolio`}
              className="btn-primary section-header-cta"
            >
              {messages.portfolio.exploreAll}
            </MagneticButton>
          }
        />
        {children}
      </div>
    </section>
  );
}
