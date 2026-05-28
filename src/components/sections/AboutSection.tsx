import RevealOnScroll from "@/components/motion/RevealOnScroll";
import type { Messages } from "@/i18n/messages";
import { profile } from "@/features/profile/data/profile";
import type { Locale } from "@/lib/i18n";

type AboutSectionProps = {
  messages: Messages;
  locale: Locale;
};

export default function AboutSection({ messages, locale }: AboutSectionProps) {
  return (
    <section id="about" className="section">
      <div className="container">
        <RevealOnScroll className="section-head section-head-row">
          <span className="section-index">02</span>
          <h2 className="section-title">{messages.about.sectionTitle}</h2>
          <span className="section-spacer" />
        </RevealOnScroll>
        <div className="section-divider" />

        <div className="about-grid">
          <article className="info-card about-left">
            <div className="about-portrait" />
            <h3 className="about-name">{profile.name}</h3>
            <p className="muted">{profile.title}</p>
            <p className="about-year">2018 - Present</p>
          </article>
          <article className="info-card about-right">
            <p className="mono-label">{messages.about.sectionDesc}</p>
            <p>{locale === "zh" ? profile.bioZh : profile.bioEn}</p>
            <a href={profile.resumeUrl} className="work-link">
              {messages.about.resume}
            </a>
            <h3 className="subhead">{messages.about.skillsTitle}</h3>
            <div className="tags">
              {profile.skills.map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>
            <h3 className="subhead">{messages.about.timelineTitle}</h3>
            <ul className="timeline">
              {profile.timeline.map((item) => (
                <li key={item.year}>
                  <strong>{item.year}</strong> {item.title} - {item.desc}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

