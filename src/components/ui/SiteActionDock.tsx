"use client";

import { useSyncExternalStore } from "react";
import MagneticButton from "@/components/motion/MagneticButton";
import { getStoredAdminToken } from "@/lib/admin/api";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

type SiteActionDockProps = {
  messages: Messages;
  locale: Locale;
};

function getAdminHref(locale: Locale): string {
  const token = getStoredAdminToken();
  return token ? `/${locale}/admin/works` : `/${locale}/admin`;
}

function subscribeAdminHref(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("portfolio-admin-token", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("portfolio-admin-token", onStoreChange);
  };
}

export default function SiteActionDock({ messages, locale }: SiteActionDockProps) {
  const adminHref = useSyncExternalStore(
    subscribeAdminHref,
    () => getAdminHref(locale),
    () => `/${locale}/admin`,
  );

  return (
    <div className="site-dock" aria-label="管理入口">
      <MagneticButton as="a" href={adminHref}>
        {messages.dock.admin}
      </MagneticButton>
    </div>
  );
}
