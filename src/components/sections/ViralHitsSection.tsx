import SectionHeader from "@/components/ui/SectionHeader";
import ViralMetricsGrid from "@/components/sections/ViralMetricsGrid";
import ViralCaseCards from "@/components/sections/ViralCaseCards";
import { getViralHits } from "@/features/profile/data/viral-hits";
import { getCases } from "@/features/profile/data/case-details";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type Props = {
  messages: Messages;
  locale: Locale;
};

export default function ViralHitsSection({ messages, locale }: Props) {
  const { metrics } = getViralHits(locale);
  const cases = getCases(locale);

  return (
    <section id="viral-hits" className="section viral-hits-section">
      <div className="container">
        <SectionHeader
          index="02"
          title={messages.viralHits.sectionTitle}
        />
        <ViralMetricsGrid metrics={metrics} />
        <ViralCaseCards cases={cases} />
      </div>
    </section>
  );
}
