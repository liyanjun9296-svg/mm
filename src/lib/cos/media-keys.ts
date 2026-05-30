import type { WorkItem } from "@/features/portfolio/types";
import { getCosEnv } from "./env";

const WORKS_MEDIA_PREFIX = "works/";

/** 仅当 URL 属于当前 Bucket 且路径以 works/ 开头时返回 COS 对象键 */
export function cosKeyFromPublicUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const env = getCosEnv();
  if (!env) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const base = new URL(env.publicBaseUrl);
    if (parsed.hostname !== base.hostname) {
      return null;
    }

    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    if (!key.startsWith(WORKS_MEDIA_PREFIX)) {
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

export function collectWorkMediaUrls(work: WorkItem): string[] {
  const urls = [work.coverImage, work.mediaUrl, ...(work.detailImages ?? [])].filter(Boolean);
  return [...new Set(urls)];
}

export function collectWorkMediaKeys(work: WorkItem): string[] {
  const keys = collectWorkMediaUrls(work)
    .map(cosKeyFromPublicUrl)
    .filter((key): key is string => key !== null);
  return [...new Set(keys)];
}

export function isUrlReferencedByOtherWorks(url: string, works: WorkItem[], excludeSlug: string): boolean {
  return works.some((item) => {
    if (item.slug === excludeSlug) {
      return false;
    }
    return collectWorkMediaUrls(item).includes(url);
  });
}

export function resolveDeletableMediaKeys(
  work: WorkItem,
  allWorks: WorkItem[],
): { keys: string[]; skippedKeys: string[] } {
  const urls = collectWorkMediaUrls(work);
  const keys: string[] = [];
  const skippedKeys: string[] = [];

  for (const url of urls) {
    const key = cosKeyFromPublicUrl(url);
    if (!key) {
      continue;
    }
    if (isUrlReferencedByOtherWorks(url, allWorks, work.slug)) {
      skippedKeys.push(key);
      continue;
    }
    keys.push(key);
  }

  return { keys: [...new Set(keys)], skippedKeys: [...new Set(skippedKeys)] };
}
