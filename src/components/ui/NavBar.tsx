"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type NavBarProps = {
  messages: Messages;
  locale: Locale;
};

const DEFAULT_SCROLL_DISTANCE = 200;

const SECTION_IDS = ["home", "works", "about", "contact"] as const;

type NavKey = "home" | "works" | "allWorks" | "about" | "contact";

const NAV_LINKS: { key: NavKey; section?: string; route?: boolean }[] = [
  { key: "home", section: "home" },
  { key: "works", section: "works" },
  { key: "allWorks", route: true },
  { key: "about", section: "about" },
  { key: "contact", section: "contact" },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const pathname = usePathname();

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  // Scroll progress for nav glass effect
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

  // IntersectionObserver for active section detection (homepage only)
  useEffect(() => {
    if (!isHomePage) {
      setActiveSection(null);
      return;
    }

    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(id, entry.intersectionRatio);
            } else {
              visibleSections.delete(id);
            }
          });

          // Pick the section with highest visibility
          let best: string | null = null;
          let bestRatio = 0;
          visibleSections.forEach((ratio, section) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = section;
            }
          });
          setActiveSection(best);
        },
        { threshold: [0, 0.3, 0.6] }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [isHomePage]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (link: (typeof NAV_LINKS)[number]) => {
    if (link.route) {
      return pathname === `/${locale}/portfolio` || pathname === `/${locale}/portfolio/`;
    }
    return activeSection === link.section;
  };

  return (
    <header
      className="nav glass"
      style={{ "--nav-progress": navProgress } as CSSProperties}
    >
      <div className="container nav-inner">
        <Link className="brand" href={`/${locale}`} aria-label="XINMING">
          <Image
            src="/logo.svg"
            alt=""
            width={1200}
            height={300}
            priority
            unoptimized
            className="brand-logo"
          />
        </Link>
        <nav className="menu" aria-label="Main">
          {isHomePage ? (
            NAV_LINKS.map((link) =>
              link.route ? (
                <Link
                  key={link.key}
                  href={`/${locale}/portfolio`}
                  className={isActive(link) ? "active" : undefined}
                >
                  {messages.nav[link.key]}
                </Link>
              ) : (
                <a
                  key={link.key}
                  href={`#${link.section}`}
                  className={isActive(link) ? "active" : undefined}
                >
                  {messages.nav[link.key]}
                </a>
              )
            )
          ) : (
            <>
              <Link href={`/${locale}`}>{messages.nav.homePage}</Link>
              <Link href={`/${locale}/contact`}>{messages.nav.contact}</Link>
            </>
          )}
        </nav>
        <div className="nav-right">
          <LanguageSwitch locale={locale} />
          {isHomePage ? (
            <a className="nav-cta" href="#contact">
              {messages.nav.contact}
            </a>
          ) : (
            <Link className="nav-cta" href={`/${locale}/contact`}>
              {messages.nav.contact}
            </Link>
          )}
          <button
            type="button"
            className="nav-menu-toggle"
            aria-expanded={mobileMenuOpen}
            aria-controls="nav-mobile-panel"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="nav-menu-toggle-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        id="nav-mobile-panel"
        className="nav-mobile-panel"
        hidden={!mobileMenuOpen}
      >
        <ul className="nav-mobile-links">
          {isHomePage ? (
            NAV_LINKS.map((link) => (
              <li key={link.key}>
                {link.route ? (
                  <Link href={`/${locale}/portfolio`} onClick={closeMobileMenu}>
                    {messages.nav[link.key]}
                  </Link>
                ) : (
                  <a href={`#${link.section}`} onClick={closeMobileMenu}>
                    {messages.nav[link.key]}
                  </a>
                )}
              </li>
            ))
          ) : (
            <>
              <li>
                <Link href={`/${locale}`} onClick={closeMobileMenu}>
                  {messages.nav.homePage}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} onClick={closeMobileMenu}>
                  {messages.nav.contact}
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}
