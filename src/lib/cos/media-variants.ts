import { cosKeyFromDevMediaUrl, cosKeyFromPublicUrl } from "@/lib/cos/media-keys";
import { getCosPublicUrl } from "@/lib/cos/env";

export type MediaVariant = "list" | "admin" | "detail";

export const MEDIA_VARIANTS: MediaVariant[] = ["list", "admin", "detail"];

const IMAGE_PREFIX = /^works\/(gallery|covers)\//;
const VARIANT_KEY = /^(.+)\.(list|admin|detail)\.webp$/;
const LEGACY_IMAGE_KEY =
  /^(works\/(?:gallery|covers)\/.+?)\.(jpe?g|png|webp|gif|avif)$/i;

/** 从 detail 对象键或 legacy 键解析媒体 base（无后缀） */
export function mediaBaseFromKey(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").trim();
  if (!IMAGE_PREFIX.test(normalized)) {
    return null;
  }

  const variantMatch = normalized.match(VARIANT_KEY);
  if (variantMatch) {
    return variantMatch[1]!;
  }

  const legacyMatch = normalized.match(LEGACY_IMAGE_KEY);
  if (legacyMatch) {
    return legacyMatch[1]!;
  }

  return null;
}

export function isWorksImageDetailKey(key: string): boolean {
  const normalized = key.replace(/^\/+/, "").trim();
  if (!IMAGE_PREFIX.test(normalized)) {
    return false;
  }
  return normalized.endsWith(".detail.webp") || mediaBaseFromKey(normalized) !== null;
}

export function variantKeyFromBase(base: string, variant: MediaVariant): string {
  return `${base}.${variant}.webp`;
}

export function variantKeyFromDetailKey(detailKey: string, variant: MediaVariant): string | null {
  const base = mediaBaseFromKey(detailKey);
  if (!base) {
    return null;
  }
  return variantKeyFromBase(base, variant);
}

export function allVariantKeysFromDetailKey(detailKey: string): string[] {
  const base = mediaBaseFromKey(detailKey);
  if (!base) {
    return [detailKey.replace(/^\/+/, "")];
  }
  return MEDIA_VARIANTS.map((variant) => variantKeyFromBase(base, variant));
}

export function cosKeyFromMediaUrl(url: string): string | null {
  if (!url?.trim()) {
    return null;
  }
  return cosKeyFromDevMediaUrl(url) ?? cosKeyFromPublicUrl(url);
}

export function mediaVariantUrl(detailUrl: string, variant: MediaVariant): string {
  if (!detailUrl?.trim()) {
    return detailUrl;
  }

  if (variant === "detail") {
    return detailUrl;
  }

  const devKey = cosKeyFromDevMediaUrl(detailUrl);
  if (devKey) {
    const base = mediaBaseFromKey(devKey);
    if (!base) {
      return detailUrl;
    }
    const variantKey = variantKeyFromBase(base, variant);
    try {
      const parsed = new URL(detailUrl, "http://localhost");
      parsed.searchParams.set("key", variantKey);
      return `${parsed.pathname}?${parsed.searchParams.toString()}`;
    } catch {
      return `/api/dev/media?key=${encodeURIComponent(variantKey)}`;
    }
  }

  const cosKey = cosKeyFromPublicUrl(detailUrl);
  if (!cosKey) {
    return detailUrl;
  }

  const base = mediaBaseFromKey(cosKey);
  if (!base) {
    return detailUrl;
  }

  const variantKey = variantKeyFromBase(base, variant);
  try {
    const parsed = new URL(detailUrl);
    parsed.pathname = `/${variantKey}`;
    parsed.search = "";
    return parsed.toString();
  } catch {
    return getCosPublicUrl(variantKey);
  }
}

export function expandMediaKeysWithVariants(keys: string[]): string[] {
  const expanded = new Set<string>();
  for (const key of keys) {
    const normalized = key.replace(/^\/+/, "");
    const base = mediaBaseFromKey(normalized);
    if (base) {
      for (const variant of MEDIA_VARIANTS) {
        expanded.add(variantKeyFromBase(base, variant));
      }
      expanded.add(normalized);
    } else {
      expanded.add(normalized);
    }
  }
  return [...expanded];
}
