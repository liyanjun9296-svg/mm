"use client";

export type WorkMediaKind =
  | "video"
  | "video-original"
  | "cover"
  | "gallery"
  | "gallery-detail";

export function slugify(input: string): string {
  const ascii = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (ascii) {
    return ascii;
  }

  return `work-${Date.now()}`;
}

export function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return base || "摄影作品";
}

export function defaultMediaKey(file: File, folder: string): string {
  const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return `${folder}/${Date.now()}-${safeName || "file"}`;
}

function fileExtension(file: File): string {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) {
    return fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return "bin";
}

/** 详情素材每次上传都用 timestamp+random 的唯一后缀，避免复用 detailIndex 时覆盖既有 COS 对象。
 *  既有同 key 旧对象被新文件 PUT 覆盖会导致：旧 URL 仍在 JSON / 浏览器缓存中 →
 *  视觉上"传上去的图变成了旧的那张"。
 *  孤儿留在 COS 由 `npm run cos:prune-orphans` 清理。 */
function uniqueDetailSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** 按作品 slug 固定 COS 路径，避免时间戳 key 产生孤儿文件 */
export function workMediaKey(
  slug: string,
  kind: WorkMediaKind,
  file: File,
  detailIndex?: number,
): string {
  const safe = slug.trim().replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
  const ext = fileExtension(file);
  switch (kind) {
    case "video":
      // 1080p 低档(默认播放),CLI `npm run process:video` 产出。后台 GUI 不直传到此路径。
      return `works/videos/${safe}.mp4`;
    case "video-original":
      // 原片 faststart 后,GUI 上传 / CLI process 都落到这里。
      return `works/videos/${safe}.original.${ext}`;
    case "cover":
      return `works/covers/${safe}.detail.webp`;
    case "gallery":
      return `works/gallery/${safe}.detail.webp`;
    case "gallery-detail": {
      // detailIndex 仅用于上传顺序追踪 / 状态消息，不参与 key 命名（防覆盖）
      void detailIndex;
      const suffix = uniqueDetailSuffix();
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
      if (isVideo) {
        return `works/gallery/${safe}-${suffix}.${ext}`;
      }
      return `works/gallery/${safe}-${suffix}.detail.webp`;
    }
  }
}

export function resolveUploadSlug(slug: string, title: string): string | null {
  const resolved = slug.trim() || slugify(title);
  return resolved || null;
}
