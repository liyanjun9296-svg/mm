"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type LanguageSwitchProps = {
  locale: Locale;
};

export default function LanguageSwitch({ locale }: LanguageSwitchProps) {
  const pathname = usePathname();
  const targetLocale = locale === "zh" ? "en" : "zh";
  const swappedPath = pathname.replace(`/${locale}`, `/${targetLocale}`);

  return (
    <div className="lang-switch">
      <Link className={`lang-btn ${locale === "en" ? "active" : ""}`} href={locale === "en" ? pathname : swappedPath}>
        EN
      </Link>
      <span className="lang-divider">/</span>
      <Link className={`lang-btn ${locale === "zh" ? "active" : ""}`} href={locale === "zh" ? pathname : swappedPath}>
        中
      </Link>
    </div>
  );
}

