"use client";

import type { WorkItem } from "@/features/portfolio/types";
import { authHeaders } from "@/lib/admin/token";

export type DevPullResult = {
  worksCount: number;
  mediaDownloaded: number;
  mediaSkipped: number;
  mediaFailed: { key: string; error: string }[];
};

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

export type WorkVideoStatus = {
  slug: string;
  status: "dual" | "raw-only" | "none";
  mediaUrl: string | null;
  mediaUrlOriginal: string | null;
};

/** 从 COS 实时读取单条作品视频状态（绕过本地快照） */
export async function fetchWorkStatusAdmin(token: string, slug: string): Promise<WorkVideoStatus> {
  const res = await fetch(`/api/admin/works/${encodeURIComponent(slug)}/status`, {
    headers: authHeaders(token),
  });
  const data = (await res.json()) as WorkVideoStatus & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "查询状态失败");
  }
  return data;
}
