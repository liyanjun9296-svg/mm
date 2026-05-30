"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type NavBarProps = {
  messages: Messages;
  locale: Locale;
};

const DEFAULT_SCROLL_DISTANCE = 200;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function readScrollDistancePx(): number {
  if (typeof window === "undefined") {
    return DEFAULT_SCROLL_DISTANCE;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-scroll-distance")
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SCROLL_DISTANCE;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function NavBar({ messages, locale }: NavBarProps) {
  const [navProgress, setNavProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      rafRef.current = null;
      const scrollY = window.scrollY;
      const distance = readScrollDistancePx();

      if (prefersReducedMotion()) {
        setNavProgress(scrollY > distance * 0.5 ? 1 : 0);
        return;
      }

      const raw = clamp(scrollY / distance, 0, 1);
      setNavProgress(easeOutCubic(raw));
    };

    const onScroll = () => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <header
      className="nav glass"
      style={{ "--nav-progress": navProgress } as CSSProperties}
    >
      <div className="container nav-inner">
        <Link className="brand" href={`/${locale}`}>
          XINMING
        </Link>
        <nav className="menu">
          <a href="#capabilities">{messages.nav.capabilities}</a>
          <a href="#works">{messages.nav.works}</a>
          <a href="#about">{messages.nav.about}</a>
          <a href="#contact">{messages.nav.contact}</a>
        </nav>
        <div className="nav-right">
          <LanguageSwitch locale={locale} />
          <a className="nav-cta" href="#contact">
            {messages.nav.contact}
          </a>
        </div>
      </div>
    </header>
  );
}
