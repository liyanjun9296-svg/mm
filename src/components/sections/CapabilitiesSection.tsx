import SectionHeader from "@/components/ui/SectionHeader";
import CapabilitiesGrid from "@/components/sections/CapabilitiesGrid";
import type { Messages } from "@/i18n/messages";

type CapabilitiesSectionProps = {
  messages: Messages;
};

export default function CapabilitiesSection({ messages }: CapabilitiesSectionProps) {
  return (
    <section id="capabilities" className="section capabilities-section">
      <div className="container">
        <SectionHeader index="00" title={messages.capabilities.sectionTitle} />
        <CapabilitiesGrid />
      </div>
    </section>
  );
}
