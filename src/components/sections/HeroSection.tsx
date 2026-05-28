import Image from "next/image";
import MagneticButton from "@/components/motion/MagneticButton";
import type { Messages } from "@/i18n/messages";

type HeroSectionProps = {
  messages: Messages;
};

export default function HeroSection({ messages }: HeroSectionProps) {
  return (
    <section id="home" className="hero">

      {/* 层 1（z-1）：所有文字，居中对齐，人物后面 */}
      <div className="hero-text-layer">
        <div className="container">
          <p className="eyebrow hero-anim" style={{ animationDelay: "0ms" }}>
            {messages.hero.eyebrow}
          </p>
          <h1 className="hero-line1 hero-anim" style={{ animationDelay: "80ms" }}>
            VIDEO CREATOR
          </h1>
          <div className="hero-line2-group">
            <h1
              className="hero-line2"
              aria-hidden="true"
            >
              <span className="hero-line2-outline">&amp; FILMMAKERER</span>
              <span className="hero-line2-fill">&amp; FILMMAKERER</span>
            </h1>
            <p className="hero-desc hero-anim" style={{ animationDelay: "300ms" }}>
              {messages.hero.description}
            </p>
          </div>
        </div>
      </div>

      {/* 层 2（z-3）：人物图片，底部对齐居中，压在文字前面 */}
      {/* hero-portrait-wrap 作为按钮定位父级 */}
      <div className="hero-portrait-layer">
        <div className="hero-portrait-wrap">
          <Image
            src="/images/portrait-v5.png"
            alt="portrait"
            width={1056}
            height={594}
            priority
            className="hero-portrait-img"
          />
          <div
            className="hero-cta hero-anim"
            style={{ animationDelay: "500ms" }}
          >
            <MagneticButton as="a" href="#works">
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
