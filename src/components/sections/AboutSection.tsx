import SectionHeader from "@/components/ui/SectionHeader";
import FaqAccordion from "@/components/ui/FaqAccordion";
import type { Messages } from "@/i18n/messages";
import { profile } from "@/features/profile/data/profile";
import type { Locale } from "@/lib/i18n";

type AboutSectionProps = {
  messages: Messages;
  locale: Locale;
};

export default function AboutSection({ messages, locale }: AboutSectionProps) {
  const bio = locale === "zh" ? profile.bioZh : profile.bioEn;

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <SectionHeader index="02" title={messages.about.sectionTitle} />

        <div className="about-grid">
          <article className="about-left-card">
            <div className="about-portrait" />
            <h3 className="about-name">{profile.name}</h3>
            <p className="about-role">{profile.title}</p>
            <p className="about-location">{profile.location}</p>
          </article>

          <article className="about-right">
            <div className="about-block">
              <p className="mono-label">ABOUT</p>
              <p className="about-bio">{bio}</p>
            </div>

            <div className="about-block">
              <div className="tags">
                {profile.skills.map((item) => (
                  <span key={item} className="tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="about-block">
              <p className="mono-label">EXPERIENCE</p>
              <ul className="about-exp-list">
                {profile.timeline.map((item) => (
                  <li key={item.year} className="about-exp-item">
                    <span className="about-exp-year">{item.year}</span>
                    <div className="about-exp-body">
                      <strong>
                        {item.title} — {item.role}
                      </strong>
                      <p>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        <FaqAccordion items={profile.faq} />
      </div>
    </section>
  );
}
