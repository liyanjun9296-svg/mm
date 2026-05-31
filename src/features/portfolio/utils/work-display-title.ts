import type { WorkItem } from "@/features/portfolio/types";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export function getWorkDisplayTitle(
  work: WorkItem,
  _locale: Locale,
  messages: Messages,
): string {
  if (work.category === "photo") {
    return messages.portfolio.photoDisplayTitle;
  }
  return work.title;
}
