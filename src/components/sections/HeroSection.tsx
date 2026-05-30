import Image from "next/image";
import MagneticButton from "@/components/motion/MagneticButton";
import type { HeroDisplayFontPreset } from "@/config/hero-display-font";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type HeroSectionProps = {
  messages: Messages;
  locale: Locale;
  displayFont?: HeroDisplayFontPreset;
};

export default function HeroSection({ messages, locale, displayFont = "helvetica" }: HeroSectionProps) {
  return (
    <section id="home" className={`hero hero-display--${displayFont}`}>

      {/* 层 1（z-1）：所有文字，居中对齐，人物后面 */}
      <div className="hero-text-layer">
        <div className="container">
          <p className="hero-eyebrow hero-anim" style={{ animationDelay: "0ms" }}>
            {messages.hero.eyebrow}
          </p>
          <h1 className="hero-line1 hero-anim" style={{ animationDelay: "80ms" }}>
            {messages.hero.line1}
          </h1>
          <div className="hero-line2-group">
            <h1
              className="hero-line2"
              aria-hidden="true"
            >
              <span className="hero-line2-outline">{messages.hero.line2}</span>
              <span className="hero-line2-fill">{messages.hero.line2}</span>
            </h1>
            <ul className="hero-tags hero-anim" style={{ animationDelay: "300ms" }}>
              {messages.hero.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 层 2（z-3）：人物图片，底部对齐居中，压在文字前面 */}
      <div className="hero-portrait-layer">
        <div className="hero-portrait-wrap">
          <Image
            src="/images/portrait-hero.png"
            alt="portrait"
            width={2112}
            height={1188}
            priority
            className="hero-portrait-img"
          />
          <div className="hero-cta hero-anim" style={{ animationDelay: "500ms" }}>
            <MagneticButton as="a" href={`/${locale}/portfolio`}>
              {messages.hero.ctaPrimary}
            </MagneticButton>
            <MagneticButton as="a" href="#contact" className="btn-primary">
              {messages.hero.ctaSecondary}
            </MagneticButton>
          </div>
        </div>
      </div>

      <p className="scroll-hint hero-anim" style={{ animationDelay: "700ms" }}>
        ↓ SCROLL
      </p>
    </section>
  );
}
