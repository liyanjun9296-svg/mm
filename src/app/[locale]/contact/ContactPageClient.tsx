"use client";

import { useState } from "react";
import Image from "next/image";
import type { ContactPlatform } from "@/features/profile/data/profile";
import { contactInfo } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";

type ContactPageClientProps = {
  messages: Messages;
  platforms: ContactPlatform[];
};

export default function ContactPageClient({
  messages,
  platforms,
}: ContactPageClientProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { contact: t } = messages;

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <div className="contact-main">
        <div className="contact-cta-block">
          <h2 className="contact-headline">{t.headline}</h2>
          {/* Contact info inline instead of CTA button */}
          <div className="contact-page-inline">
            <div className="contact-page-text-info">
              <div className="contact-page-row">
                <span className="contact-page-label">{t.phoneLabel}</span>
                <span className="contact-page-value">{contactInfo.phone}</span>
                <button
                  type="button"
                  className="contact-page-copy"
                  onClick={() => handleCopy(contactInfo.phone, "phone")}
                >
                  {copied === "phone" ? t.copied : t.copy}
                </button>
              </div>
              <div className="contact-page-row">
                <span className="contact-page-label">{t.emailLabel}</span>
                <span className="contact-page-value">{contactInfo.email}</span>
                <button
                  type="button"
                  className="contact-page-copy"
                  onClick={() => handleCopy(contactInfo.email, "email")}
                >
                  {copied === "email" ? t.copied : t.copy}
                </button>
              </div>
            </div>
            <div className="contact-page-divider" aria-hidden="true" />
            <div className="contact-page-qr">
              <Image
                src="/images/wechat-qr.jpg"
                alt="WeChat QR"
                width={144}
                height={144}
                unoptimized
              />
              <span className="contact-page-qr-hint">扫码添加好友</span>
            </div>
          </div>
        </div>

        <div className="contact-platforms">
          <p className="contact-platforms-label">{t.platformsLabel}</p>
          <div className="contact-platform-list">
            {platforms.map((platform, index) => (
              <div key={platform.index}>
                {index > 0 ? <div className="contact-platform-divider" aria-hidden="true" /> : null}
                <a
                  className="contact-platform-row hover-row"
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="contact-platform-left">
                    <span className="contact-platform-index">{platform.index}</span>
                    <div>
                      <h3 className="contact-platform-name">{platform.name}</h3>
                      <p className="contact-platform-note">{platform.note}</p>
                    </div>
                  </div>
                  <span className="contact-platform-arrow">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="contact-site-footer">
        <p>{messages.footer.copyright}</p>
        <p>{messages.footer.brand}</p>
      </footer>
    </>
  );
}
