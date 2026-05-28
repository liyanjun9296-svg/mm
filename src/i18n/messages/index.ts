import en from "./en";
import zh from "./zh";
import type { Locale } from "@/lib/i18n";

const messages = {
  zh,
  en,
} as const;

export type Messages = (typeof messages)[Locale];

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

