import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { WorkItem } from "@/features/portfolio/types";
import {
  cosKeyFromDevMediaUrl,
  cosKeyFromPublicUrl,
  normalizeWorkMediaUrlsForCos,
} from "@/lib/cos/media-keys";
import { getCosPublicUrl } from "@/lib/cos/env";

export const DEV_DATA_DIR = join(process.cwd(), ".dev-data");
export const DEV_WORKS_FILE = join(DEV_DATA_DIR, "works.json");
export const DEV_MEDIA_DIR = join(DEV_DATA_DIR, "media");

/** development + DEV_USE_LOCAL_SNAPSHOT=1 时启用本地快照读路径 */
export function isDevLocalSnapshotEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_USE_LOCAL_SNAPSHOT === "1"
  );
}

export function localMediaPath(key: string): string {
  return join(DEV_MEDIA_DIR, key.replace(/^\/+/, ""));
}

export function hasLocalMediaFile(key: string): boolean {
  return existsSync(localMediaPath(key));
}

export async function readLocalWorksSnapshot(): Promise<WorkItem[] | null> {
  if (!existsSync(DEV_WORKS_FILE)) {
    return null;
  }
  try {
    const raw = await readFile(DEV_WORKS_FILE, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) {
      return null;
    }
    return data as WorkItem[];
  } catch {
    return null;
  }
}

/** 后台保存/删除后写穿本地 works 快照（仅 DEV_USE_LOCAL_SNAPSHOT=1） */
export async function writeLocalWorksSnapshot(works: WorkItem[]): Promise<void> {
  if (!isDevLocalSnapshotEnabled()) {
    return;
  }
  await mkdir(DEV_DATA_DIR, { recursive: true });
  const normalized = works.map(normalizeWorkMediaUrlsForCos);
  await writeFile(DEV_WORKS_FILE, JSON.stringify(normalized, null, 2), "utf8");
}

function resolveWorksMediaKey(url: string): string | null {
  return cosKeyFromDevMediaUrl(url) ?? cosKeyFromPublicUrl(url);
}

/** 将 COS 公网 URL 改写为 dev 本地媒体代理（仅 snapshot 模式） */
export function devMediaUrl(url: string): string {
  if (!url || !isDevLocalSnapshotEnabled()) {
    return url;
  }
  const key = resolveWorksMediaKey(url);
  if (!key) {
    return url;
  }
  if (!hasLocalMediaFile(key)) {
    try {
      return getCosPublicUrl(key);
    } catch {
      return url;
    }
  }
  return `/api/dev/media?key=${encodeURIComponent(key)}`;
}

export function applyDevMediaUrls(work: WorkItem): WorkItem {
  if (!isDevLocalSnapshotEnabled()) {
    return work;
  }
  return {
    ...work,
    coverImage: devMediaUrl(work.coverImage),
    mediaUrl: devMediaUrl(work.mediaUrl),
    detailImages: work.detailImages?.map((url) => devMediaUrl(url)),
  };
}

export function applyDevMediaUrlsToWorks(works: WorkItem[]): WorkItem[] {
  if (!isDevLocalSnapshotEnabled()) {
    return works;
  }
  return works.map(applyDevMediaUrls);
}
