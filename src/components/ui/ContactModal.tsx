"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { type ContactInfo } from "@/features/profile/data/profile";
import type { Messages } from "@/i18n/messages";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  messages: Messages;
  contactInfo: ContactInfo;
};

type CopyTarget = "phone" | "email" | null;

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContactModal({
  open,
  onClose,
  messages,
  contactInfo,
}: ContactModalProps) {
  const [copied, setCopied] = useState<CopyTarget>(null);

  const handleCopy = useCallback(async (value: string, target: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const { contact: t } = messages;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div
        className="contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="contact-modal-header">
          <div className="contact-modal-title-group">
            <h2 id="contact-modal-title" className="contact-modal-title">
              {t.modalTitle}
            </h2>
            <p className="contact-modal-subtitle">{t.modalSubtitle}</p>
          </div>
          <button
            type="button"
            className="contact-modal-close"
            onClick={onClose}
            aria-label={t.close}
          >
            ✕
          </button>
        </div>

        <div className="contact-modal-divider" aria-hidden="true" />

        <div className="contact-modal-body">
          <div className="contact-modal-main">
            <div className="contact-modal-row">
              <p className="contact-modal-label">{t.phoneLabel}</p>
              <div className="contact-modal-value-row">
                <span className="contact-modal-value">{contactInfo.phone}</span>
                <a
                  href={`tel:${contactInfo.phoneTel}`}
                  className="contact-modal-action"
                  aria-label={t.call}
                >
                  <PhoneIcon />
                </a>
                <button
                  type="button"
                  className="contact-modal-action"
                  aria-label={t.copy}
                  onClick={() => handleCopy(contactInfo.phone, "phone")}
                >
                  <CopyIcon />
                </button>
                {copied === "phone" ? (
                  <span className="contact-modal-copied">{t.copied}</span>
                ) : null}
              </div>
            </div>

            <div className="contact-modal-divider contact-modal-divider--inner" aria-hidden="true" />

            <div className="contact-modal-row">
              <p className="contact-modal-label">{t.emailLabel}</p>
              <div className="contact-modal-value-row">
                <span className="contact-modal-value contact-modal-value--email">
                  {contactInfo.email}
                </span>
                <button
                  type="button"
                  className="contact-modal-action"
                  aria-label={t.copy}
                  onClick={() => handleCopy(contactInfo.email, "email")}
                >
                  <CopyIcon />
                </button>
                {copied === "email" ? (
                  <span className="contact-modal-copied">{t.copied}</span>
                ) : null}
              </div>
            </div>

            <div className="contact-modal-divider contact-modal-divider--inner" aria-hidden="true" />
          </div>

          <aside className="contact-modal-wechat">
            <p className="contact-modal-label">{t.wechatLabel}</p>
            <div className="contact-modal-qr">
              <Image
                src="/images/wechat-qr.jpg"
                alt={t.wechatHint}
                width={312}
                height={312}
                className="contact-modal-qr-img"
              />
            </div>
            <p className="contact-modal-wechat-hint">{t.wechatHint}</p>
          </aside>
        </div>

        <div className="contact-modal-footer">
          <p>{t.modalFooter}</p>
        </div>
      </div>
    </div>
  );
}
