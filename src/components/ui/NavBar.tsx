"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type NavBarProps = {
  messages: Messages;
  locale: Locale;
};

export default function NavBar({ messages, locale }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav glass${scrolled ? " nav--capsule" : ""}`}>
      <div className="container nav-inner">
        <Link className="brand" href={`/${locale}`}>
          XINMING
        </Link>
        <nav className="menu">
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
