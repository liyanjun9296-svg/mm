"use client";

import type { WorkItem } from "@/features/portfolio/types";

const TOKEN_KEY = "portfolio_admin_token";
const SERVER_UPLOAD_MAX = 50 * 1024 * 1024;
const PRESIGN_PUT_TIMEOUT_MS = 120_000;

export const SERVER_UPLOAD_MAX_BYTES = SERVER_UPLOAD_MAX;
export const VIDEO_UPLOAD_WARN_BYTES = 80 * 1024 * 1024;
export const VIDEO_UPLOAD_CONFIRM_BYTES = 200 * 1024 * 1024;

export function getStoredAdminToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

function notifyAdminTokenChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("portfolio-admin-token"));
  }
}

export function setStoredAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  notifyAdminTokenChange();
}

export function clearStoredAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  notifyAdminTokenChange();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function guessContentType(file: File): string {
  if (file.type) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}


function formatUploadError(res: Response, data: { error?: string }, fallback: string): string {
  if (data.error) {
    return data.error;
  }
  return `${fallback} (HTTP ${res.status})`;
}

export function formatUploadFailure(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "上传超时：请检查网络。超过 50MB 的文件需在 COS 配置 CORS 后直传，或压缩后再试";
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "网络请求失败：请确认 dev 已启动；超过 50MB 的直传还需在 COS 控制台配置 CORS（PUT + localhost 来源）";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "上传失败";
}

async function uploadViaPresign(token: string, file: File, key: string): Promise<string> {
  const contentType = guessContentType(file);
  const presignRes = await fetch("/api/cos/presign", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ key, contentType }),
  });

  const presignData = (await presignRes.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  };

  if (!presignRes.ok || !presignData.uploadUrl || !presignData.publicUrl) {
    throw new Error(formatUploadError(presignRes, presignData, "预签名失败"));
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PRESIGN_PUT_TIMEOUT_MS);

  let putRes: Response;
  try {
    putRes = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("上传超时：直传 COS 无响应，请检查 CORS 或改用 ≤50MB 文件走本站中转");
    }
    throw new Error(
      "直传 COS 失败：请在腾讯云 Bucket → 安全管理 → CORS 中允许 PUT，并添加来源 http://localhost:3000（及线上域名）",
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!putRes.ok) {
    throw new Error(
      `COS 直传失败 (HTTP ${putRes.status})：请检查 Bucket CORS 是否允许 PUT，以及对象键是否合法`,
    );
  }

  return presignData.publicUrl;
}

async function uploadViaServer(token: string, file: File, key: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  const res = await fetch("/api/cos/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await res.json()) as { publicUrl?: string; error?: string };
  if (!res.ok || !data.publicUrl) {
    throw new Error(formatUploadError(res, data, "上传失败"));
  }
  return data.publicUrl;
}

export async function fetchWorksAdmin(token: string): Promise<WorkItem[]> {
  const res = await fetch("/api/admin/works", {
    headers: authHeaders(token),
  });
  const data = (await res.json()) as { works?: WorkItem[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "读取作品失败");
  }
  return data.works ?? [];
}

export type DevPullResult = {
  worksCount: number;
  mediaDownloaded: number;
  mediaSkipped: number;
  mediaFailed: { key: string; error: string }[];
};

/** 仅本地 dev：从 COS 拉取最新 works + 缺失媒体到 .dev-data/ */
export async function pullFromCosAdmin(token: string): Promise<DevPullResult> {
  const res = await fetch("/api/admin/dev/pull", {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = (await res.json()) as Partial<DevPullResult> & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "拉取失败");
  }
  return {
    worksCount: data.worksCount ?? 0,
    mediaDownloaded: data.mediaDownloaded ?? 0,
    mediaSkipped: data.mediaSkipped ?? 0,
    mediaFailed: data.mediaFailed ?? [],
  };
}

export async function fetchCategoriesAdmin(token: string): Promise<string[]> {
  const res = await fetch("/api/admin/categories", {
    headers: authHeaders(token),
  });
  const data = (await res.json()) as { categories?: string[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "读取分类失败");
  }
  return data.categories ?? [];
}

export async function saveCategoriesAdmin(
  token: string,
  categories: string[],
): Promise<void> {
  const res = await fetch("/api/admin/categories", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ categories }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "保存分类失败");
  }
}

export async function saveWorksAdmin(token: string, works: WorkItem[]): Promise<void> {
  const res = await fetch("/api/admin/works", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ works }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "保存失败");
  }
}

export async function saveWorkItemAdmin(
  token: string,
  work: WorkItem,
  options?: { isNew?: boolean; previousSlug?: string },
): Promise<void> {
  const slugSegment = options?.isNew ? "new" : encodeURIComponent(options?.previousSlug ?? work.slug);
  const res = await fetch(`/api/admin/works/${slugSegment}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      work,
      previousSlug: options?.previousSlug,
    }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "保存失败");
  }
}

export async function deleteWorkItemAdmin(
  token: string,
  slug: string,
  options?: { deleteMedia?: boolean },
): Promise<{ mediaDeleted: string[]; mediaSkipped: string[] }> {
  const query = options?.deleteMedia ? "?deleteMedia=1" : "";
  const res = await fetch(`/api/admin/works/${encodeURIComponent(slug)}${query}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = (await res.json()) as {
    error?: string;
    mediaDeleted?: string[];
    mediaSkipped?: string[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? "删除失败");
  }
  return {
    mediaDeleted: data.mediaDeleted ?? [],
    mediaSkipped: data.mediaSkipped ?? [],
  };
}

export async function saveWorkItemsBatchAdmin(token: string, items: WorkItem[]): Promise<void> {
  const res = await fetch("/api/admin/works", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "批量保存失败");
  }
}

export async function uploadFileAdmin(
  token: string,
  file: File,
  key: string,
): Promise<string> {
  if (!token.trim()) {
    throw new Error("未登录：请从 /admin 输入管理口令后再上传");
  }

  if (file.size > SERVER_UPLOAD_MAX) {
    return uploadViaPresign(token, file, key);
  }

  return uploadViaServer(token, file, key);
}

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

export type WorkMediaKind = "video" | "cover" | "gallery" | "gallery-detail";

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
      return `works/videos/${safe}.${ext}`;
    case "cover":
      return `works/covers/${safe}.${ext}`;
    case "gallery":
      return `works/gallery/${safe}.${ext}`;
    case "gallery-detail":
      return `works/gallery/${safe}-${detailIndex ?? 0}.${ext}`;
  }
}

/** 替换已有媒体前确认 */
export function confirmMediaOverwrite(
  fieldLabel: string,
  existingUrl: string | undefined,
): boolean {
  if (!existingUrl?.trim()) {
    return true;
  }
  return window.confirm(
    `该作品已有${fieldLabel}，上传将覆盖 COS 中的原文件（不可恢复）。\n\n仍要上传吗？`,
  );
}

export function resolveUploadSlug(slug: string, title: string): string | null {
  const resolved = slug.trim() || slugify(title);
  return resolved || null;
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

/** 上传前确认大视频；返回 false 表示用户取消 */
export function confirmVideoUpload(file: File): boolean {
  if (!isVideoFile(file)) {
    return true;
  }
  const mb = (file.size / 1024 / 1024).toFixed(1);
  if (file.size >= VIDEO_UPLOAD_CONFIRM_BYTES) {
    return window.confirm(
      `视频约 ${mb} MB，体积较大：\n· 每次播放都会消耗 COS 外网流量\n· 建议用 ffmpeg 压缩到 80 MB 以下再上传\n\n仍要上传吗？`,
    );
  }
  if (file.size >= VIDEO_UPLOAD_WARN_BYTES) {
    return window.confirm(
      `视频约 ${mb} MB，建议压缩后再传（目标：30s 片 30–50 MB）。仍要上传吗？`,
    );
  }
  return true;
}
