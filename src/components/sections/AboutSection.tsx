import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import FaqAccordion from "@/components/ui/FaqAccordion";
import type { Messages } from "@/i18n/messages";
import { getProfile } from "@/features/profile/data/profile";
import type { Locale } from "@/lib/i18n";

type AboutSectionProps = {
  messages: Messages;
  locale: Locale;
};

export default function AboutSection({ messages, locale }: AboutSectionProps) {
  const profile = getProfile(locale);
  const bio = locale === "zh" ? profile.bioZh : profile.bioEn;

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <SectionHeader index="02" title={messages.about.sectionTitle} />

        <div className="about-grid">
          <article className="about-left-card">
            <div className="about-portrait">
              <Image
                src="/images/about-portrait.jpg"
                alt={profile.name}
                className="about-portrait-img"
                width={760}
                height={1140}
                sizes="(max-width: 900px) 80px, 380px"
                priority
              />
              <div className="about-portrait-gradient" aria-hidden="true" />
              <div className="about-portrait-info">
                <h3 className="about-name">{profile.name}</h3>
                <p className="about-role">{profile.title}</p>
                <p className="about-location">{profile.location}</p>
              </div>
            </div>
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
                  <li
                    key={`${item.year}-${item.company ?? item.title}`}
                    className="about-exp-item"
                  >
                    <div className="about-exp-meta">
                      <span className="about-exp-year">{item.year}</span>
                      {item.company ? (
                        <span className="about-exp-company">{item.company}</span>
                      ) : null}
                    </div>
                    <div className="about-exp-body">
                      <strong>
                        {item.role ? `${item.title} — ${item.role}` : item.title}
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
