import { cosKeyFromDevMediaUrl, cosKeyFromPublicUrl } from "@/lib/cos/media-keys";
import { getCosPublicUrl } from "@/lib/cos/env";

/**
 * 图片档位枚举。
 *
 * - `detail`：详情页大图。**物理上 = legacy 原文件**（保留原扩展名，无二次压缩）。
 * - `list`：列表/卡片用 webp（`.list.webp`，约 1200w）。
 * - `admin`：后台缩略 webp（`.admin.webp`，约 120w）。
 *
 * 仅 `list` / `admin` 是实际生成的物理 webp 对象（见 `COMPRESSED_VARIANTS`），`detail` 直接复用 legacy key。
 */
export type MediaVariant = "list" | "admin" | "detail";

export const MEDIA_VARIANTS: MediaVariant[] = ["list", "admin", "detail"];

/** 实际产出物理 webp 对象的档位（不含 detail）。 */
export const COMPRESSED_VARIANTS: Exclude<MediaVariant, "detail">[] = ["list", "admin"];

const IMAGE_PREFIX = /^works\/(gallery|covers)\//;
const COMPRESSED_VARIANT_KEY = /^(.+)\.(list|admin)\.webp$/;
const LEGACY_IMAGE_KEY =
  /^(works\/(?:gallery|covers)\/.+?)\.(jpe?g|png|webp|gif|avif)$/i;

/** 从 detail（legacy）键或压缩档键解析媒体 base（无后缀） */
export function mediaBaseFromKey(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").trim();
  if (!IMAGE_PREFIX.test(normalized)) {
    return null;
  }

  const variantMatch = normalized.match(COMPRESSED_VARIANT_KEY);
  if (variantMatch) {
    return variantMatch[1]!;
  }

  const legacyMatch = normalized.match(LEGACY_IMAGE_KEY);
  if (legacyMatch) {
    return legacyMatch[1]!;
  }

  return null;
}

/** 是否为 works/{gallery|covers} 下的 detail 档（即 legacy 原图，非 list/admin webp） */
export function isWorksImageDetailKey(key: string): boolean {
  const normalized = key.replace(/^\/+/, "").trim();
  if (!IMAGE_PREFIX.test(normalized)) {
    return false;
  }
  if (COMPRESSED_VARIANT_KEY.test(normalized)) {
    return false;
  }
  return LEGACY_IMAGE_KEY.test(normalized);
}

/** 仅用于压缩档（list/admin）；detail 复用 legacy key，不应通过此函数生成。 */
export function variantKeyFromBase(
  base: string,
  variant: Exclude<MediaVariant, "detail">,
): string {
  return `${base}.${variant}.webp`;
}

export function cosKeyFromMediaUrl(url: string): string | null {
  if (!url?.trim()) {
    return null;
  }
  return cosKeyFromDevMediaUrl(url) ?? cosKeyFromPublicUrl(url);
}

/**
 * 由 detail URL 推导对应档位的访问 URL。
 *
 * - `detail`：原样返回（指向 legacy 原图）。
 * - `list` / `admin`：把 path 替换为 `.{variant}.webp` 物理对象。
 */
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

/**
 * 给定一组待删除的 key，展开为 detail（legacy 原图）+ list.webp + admin.webp 全档，
 * 用于删除作品时一并清理三份对象。
 */
export function expandMediaKeysWithVariants(keys: string[]): string[] {
  const expanded = new Set<string>();
  for (const key of keys) {
    const normalized = key.replace(/^\/+/, "");
    const base = mediaBaseFromKey(normalized);
    if (base) {
      // 保留传入的原 key（可能是 detail legacy 或某档 webp）
      expanded.add(normalized);
      // 一并展开两档压缩 webp
      for (const variant of COMPRESSED_VARIANTS) {
        expanded.add(variantKeyFromBase(base, variant));
      }
    } else {
      expanded.add(normalized);
    }
  }
  return [...expanded];
}
