import {
  FEATURED_COMPACT_MAX,
  FEATURED_LARGE_MAX,
  WORKS_CACHE_TAG,
  WORKS_INDEX_KEY,
  WORKS_JSON_BACKUP_KEY,
  WORKS_JSON_KEY,
  workItemCosKey,
} from "../constants";
import type { FeaturedLayout, WorkItem } from "../types";
import { works as seedWorks } from "./works";
import {
  applyDevMediaUrlsToWorks,
  isDevLocalSnapshotEnabled,
  readLocalWorksSnapshot,
  writeLocalWorksSnapshot,
} from "@/lib/dev/local-snapshot";
import { getCosEnv, getCosPublicUrl } from "@/lib/cos/env";
import { resolveDeletableMediaKeys } from "@/lib/cos/media-keys";
import { createCosClient } from "@/lib/cos/server";

export type WorksIndex = {
  version: 2;
  slugs: string[];
  updatedAt: string;
};

function getWorksPublicUrl(key: string): string | null {
  const env = getCosEnv();
  if (!env) {
    return null;
  }
  return getCosPublicUrl(key);
}

function parseWorks(data: unknown): WorkItem[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data as WorkItem[];
}

function parseIndex(data: unknown): WorksIndex | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const obj = data as WorksIndex;
  if (obj.version !== 2 || !Array.isArray(obj.slugs)) {
    return null;
  }
  return obj;
}

async function fetchJsonFromCos<T>(key: string): Promise<T | null> {
  const url = getWorksPublicUrl(key);
  if (!url) {
    return null;
  }
  try {
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: [WORKS_CACHE_TAG] },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchLegacyWorksFromCos(): Promise<WorkItem[] | null> {
  const json = await fetchJsonFromCos<unknown>(WORKS_JSON_KEY);
  if (json === null) {
    return null;
  }
  return parseWorks(json);
}

export async function fetchWorksIndexFromCos(): Promise<WorksIndex | null> {
  const json = await fetchJsonFromCos<unknown>(WORKS_INDEX_KEY);
  return parseIndex(json);
}

export async function fetchWorkItemFromCos(slug: string): Promise<WorkItem | null> {
  return fetchJsonFromCos<WorkItem>(workItemCosKey(slug));
}

export async function fetchWorksFromCosPerSlug(): Promise<WorkItem[] | null> {
  const index = await fetchWorksIndexFromCos();
  if (!index || index.slugs.length === 0) {
    return null;
  }

  const items = await Promise.all(
    index.slugs.map(async (slug) => {
      const item = await fetchWorkItemFromCos(slug);
      return item;
    }),
  );

  const works = items.filter((item): item is WorkItem => item !== null && !!item.slug);
  if (works.length === 0) {
    return null;
  }
  return works;
}

/** @deprecated 兼容旧名 */
export async function fetchWorksFromCos(): Promise<WorkItem[] | null> {
  const legacy = await fetchLegacyWorksFromCos();
  if (legacy && legacy.length > 0) {
    return legacy;
  }

  const perSlug = await fetchWorksFromCosPerSlug();
  if (perSlug !== null) {
    return perSlug;
  }
  return null;
}

export async function getWorks(): Promise<WorkItem[]> {
  const raw = await getWorksRaw();
  return applyDevMediaUrlsToWorks(raw);
}

async function getWorksRaw(): Promise<WorkItem[]> {
  if (isDevLocalSnapshotEnabled()) {
    const local = await readLocalWorksSnapshot();
    if (local !== null && local.length > 0) {
      return local;
    }
  }

  const remote = await fetchWorksFromCos();
  if (remote !== null) {
    return remote;
  }
  return seedWorks;
}

async function putCosJson(key: string, body: string): Promise<void> {
  const env = getCosEnv();
  if (!env) {
    throw new Error("COS 未配置");
  }

  const cos = createCosClient();
  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: env.bucket,
        Region: env.region,
        Key: key,
        Body: body,
        ContentType: "application/json; charset=utf-8",
        CacheControl: "no-cache",
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      },
    );
  });
}

async function deleteCosObject(key: string): Promise<void> {
  const env = getCosEnv();
  if (!env) {
    throw new Error("COS 未配置");
  }

  const cos = createCosClient();
  await new Promise<void>((resolve, reject) => {
    cos.deleteObject(
      {
        Bucket: env.bucket,
        Region: env.region,
        Key: key,
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      },
    );
  });
}

async function backupLegacyWorksJsonIfExists(): Promise<void> {
  const current = await fetchLegacyWorksFromCos();
  if (!current || current.length === 0) {
    return;
  }
  await putCosJson(WORKS_JSON_BACKUP_KEY, JSON.stringify(current, null, 2));
}

function buildIndex(slugs: string[]): WorksIndex {
  const unique = [...new Set(slugs.filter(Boolean))];
  return {
    version: 2,
    slugs: unique,
    updatedAt: new Date().toISOString(),
  };
}

async function getOrCreateIndex(): Promise<WorksIndex> {
  const index = await fetchWorksIndexFromCos();
  if (index) {
    return index;
  }
  const legacy = await fetchLegacyWorksFromCos();
  if (legacy && legacy.length > 0) {
    return buildIndex(legacy.map((w) => w.slug));
  }
  return buildIndex([]);
}

async function syncLegacyMirror(works: WorkItem[]): Promise<void> {
  await putCosJson(WORKS_JSON_KEY, JSON.stringify(works, null, 2));
}

function featuredSlot(work: WorkItem): FeaturedLayout {
  return work.featuredLayout === "compact" ? "compact" : "large";
}

function clearFeatured(work: WorkItem): WorkItem {
  return { ...work, featured: false, featuredLayout: undefined };
}

async function persistWorkItem(item: WorkItem): Promise<void> {
  await putCosJson(workItemCosKey(item.slug), JSON.stringify(item, null, 2));
}

/** 保存 featured 时挤占同槽位（大卡 2 / 小卡 4），按 works 顺序取消最早的超额精品 */
async function enforceFeaturedSlots(
  incoming: WorkItem,
  works: WorkItem[],
): Promise<WorkItem[]> {
  let updated = works.map((w) => (w.slug === incoming.slug ? incoming : w));
  if (!works.some((w) => w.slug === incoming.slug)) {
    updated.push(incoming);
  }

  if (!incoming.featured) {
    return updated;
  }

  const slot = featuredSlot(incoming);
  const max = slot === "compact" ? FEATURED_COMPACT_MAX : FEATURED_LARGE_MAX;
  const slotPeers = updated.filter(
    (w) => w.featured && w.slug !== incoming.slug && featuredSlot(w) === slot,
  );
  const overflow = slotPeers.length - max + 1;
  if (overflow <= 0) {
    return updated;
  }

  const toClear = slotPeers.slice(0, overflow);
  for (const peer of toClear) {
    const cleared = clearFeatured(peer);
    await persistWorkItem(cleared);
    updated = updated.map((w) => (w.slug === cleared.slug ? cleared : w));
  }

  return updated;
}

async function persistWorksLocalSnapshot(works: WorkItem[]): Promise<void> {
  if (isDevLocalSnapshotEnabled()) {
    await writeLocalWorksSnapshot(works);
  }
}

export async function saveWorkItemToCos(
  item: WorkItem,
  options?: { previousSlug?: string },
): Promise<void> {
  const previousSlug = options?.previousSlug?.trim();
  const current = await getWorksRaw();

  if (previousSlug && previousSlug !== item.slug) {
    await deleteWorkItemFromCos(previousSlug, { skipIndexUpdate: true });
  }

  let merged = current.filter((w) => w.slug !== previousSlug && w.slug !== item.slug);
  merged.push(item);
  merged = await enforceFeaturedSlots(item, merged);

  await persistWorkItem(item);

  const index = await getOrCreateIndex();
  const slugs = index.slugs.filter((s) => s !== previousSlug);
  if (!slugs.includes(item.slug)) {
    slugs.push(item.slug);
  } else {
    const i = slugs.indexOf(item.slug);
    slugs.splice(i, 1);
    slugs.push(item.slug);
  }
  await putCosJson(WORKS_INDEX_KEY, JSON.stringify(buildIndex(slugs), null, 2));

  await syncLegacyMirror(merged);
  await persistWorksLocalSnapshot(merged);
}

export type DeleteWorkResult = {
  mediaDeleted: string[];
  mediaSkipped: string[];
};

export async function deleteWorkItemFromCos(
  slug: string,
  options?: { deleteMedia?: boolean; skipIndexUpdate?: boolean },
): Promise<DeleteWorkResult> {
  const mediaDeleted: string[] = [];
  const mediaSkipped: string[] = [];

  if (options?.deleteMedia) {
    const allWorks = await getWorksRaw();
    const work = allWorks.find((w) => w.slug === slug);
    if (work) {
      const { keys, skippedKeys } = resolveDeletableMediaKeys(work, allWorks);
      mediaSkipped.push(...skippedKeys);
      for (const key of keys) {
        try {
          await deleteCosObject(key);
          mediaDeleted.push(key);
        } catch {
          // 单个媒体删除失败不阻断作品记录删除
        }
      }
    }
  }

  await deleteCosObject(workItemCosKey(slug));

  if (options?.skipIndexUpdate) {
    return { mediaDeleted, mediaSkipped };
  }

  const index = await fetchWorksIndexFromCos();
  if (!index) {
    const legacy = await fetchLegacyWorksFromCos();
    const remaining = (legacy ?? (await getWorksRaw())).filter((w) => w.slug !== slug);
    await syncLegacyMirror(remaining);
    await persistWorksLocalSnapshot(remaining);
    return { mediaDeleted, mediaSkipped };
  }

  const slugs = index.slugs.filter((s) => s !== slug);
  await putCosJson(WORKS_INDEX_KEY, JSON.stringify(buildIndex(slugs), null, 2));

  const remaining = (await getWorksRaw()).filter((w) => w.slug !== slug);
  await syncLegacyMirror(remaining);
  await persistWorksLocalSnapshot(remaining);

  return { mediaDeleted, mediaSkipped };
}

export async function saveAllWorkItemsToCos(works: WorkItem[]): Promise<void> {
  await backupLegacyWorksJsonIfExists();

  const oldIndex = await fetchWorksIndexFromCos();
  const slugs = works.map((w) => w.slug);
  const keep = new Set(slugs);

  for (const item of works) {
    await putCosJson(workItemCosKey(item.slug), JSON.stringify(item, null, 2));
  }

  await putCosJson(WORKS_INDEX_KEY, JSON.stringify(buildIndex(slugs), null, 2));
  await syncLegacyMirror(works);
  await persistWorksLocalSnapshot(works);

  if (oldIndex) {
    for (const oldSlug of oldIndex.slugs) {
      if (!keep.has(oldSlug)) {
        try {
          await deleteCosObject(workItemCosKey(oldSlug));
        } catch {
          // 忽略已不存在的对象
        }
      }
    }
  }
}

/** 兼容 seed 脚本；内部写入 per-slug + index + legacy 镜像 */
export async function saveWorksToCos(works: WorkItem[]): Promise<void> {
  await saveAllWorkItemsToCos(works);
}

export async function migrateLegacyWorksToPerSlug(works: WorkItem[]): Promise<void> {
  await saveAllWorkItemsToCos(works);
}

export { seedWorks };
