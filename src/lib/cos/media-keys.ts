import type { WorkItem } from "@/features/portfolio/types";
import { getCosEnv, getCosPublicUrl } from "./env";
import { expandMediaKeysWithVariants } from "./media-variants";

const WORKS_MEDIA_PREFIX = "works/";

/** 解析本机 dev 代理 URL（/api/dev/media?key=works/...） */
export function cosKeyFromDevMediaUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.includes("/api/dev/media")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    const key = parsed.searchParams.get("key");
    if (!key?.startsWith(WORKS_MEDIA_PREFIX)) {
      return null;
    }
    return decodeURIComponent(key);
  } catch {
    return null;
  }
}

/** 写入 COS 前：dev 代理 URL → 公网 URL；已是 COS 公网的保持不变 */
export function normalizeMediaUrlForCos(url: string): string {
  if (!url?.trim()) {
    return url;
  }

  const devKey = cosKeyFromDevMediaUrl(url);
  if (devKey) {
    return getCosPublicUrl(devKey);
  }

  const cosKey = cosKeyFromPublicUrl(url);
  if (cosKey) {
    return getCosPublicUrl(cosKey);
  }

  return url;
}

export function normalizeWorkMediaUrlsForCos(work: WorkItem): WorkItem {
  return {
    ...work,
    coverImage: normalizeMediaUrlForCos(work.coverImage),
    mediaUrl: normalizeMediaUrlForCos(work.mediaUrl),
    detailImages: work.detailImages?.map((url) => normalizeMediaUrlForCos(url)),
  };
}

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

  return { keys: expandMediaKeysWithVariants([...new Set(keys)]), skippedKeys: [...new Set(skippedKeys)] };
}
