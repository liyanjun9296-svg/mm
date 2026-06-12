import {
  FEATURED_COMPACT_MAX,
  FEATURED_LARGE_MAX,
  WORKS_INDEX_KEY,
  WORKS_JSON_BACKUP_KEY,
  WORKS_JSON_KEY,
  workItemCosKey,
} from "../constants";
import type { WorkItem } from "../types";
import { works as seedWorks } from "./works";
import {
  applyDevMediaUrlsToWorks,
  isDevLocalSnapshotEnabled,
  readLocalWorksSnapshot,
  writeLocalWorksSnapshot,
} from "@/lib/dev/local-snapshot";
import {
  normalizeWorkMediaUrlsForCos,
  resolveDeletableMediaKeys,
} from "@/lib/cos/media-keys";
import { deleteCosObject, putCosJson } from "./works-store/cos-io";
import {
  buildIndex,
  fetchLegacyWorksFromCos,
  fetchWorkItemFromCos,
  fetchWorksFromCos,
  fetchWorksIndexFromCos,
  getOrCreateIndex,
} from "./works-store/index-store";
import { clearFeatured, featuredSlot } from "./works-store/featured";

export type { WorksIndex } from "./works-store/index-store";
export {
  fetchLegacyWorksFromCos,
  fetchWorksIndexFromCos,
  fetchWorkItemFromCos,
  fetchWorksFromCosPerSlug,
  fetchWorksFromCos,
} from "./works-store/index-store";

export async function getWorks(): Promise<WorkItem[]> {
  const raw = await getWorksRaw();
  return applyDevMediaUrlsToWorks(raw);
}

/**
 * 详情页专用：只拉目标作品 + 前 2 条相关作品（按 index 顺序），
 * 把冷缓存时的 COS 请求从「1 index + N 全量」降到 ≤ 4 次。
 * dev 快照模式与 index 缺失（legacy）时回退到全量读取。
 */
export async function getWorkWithRelated(
  slug: string,
): Promise<{ work: WorkItem | null; related: WorkItem[] }> {
  const fromAll = async () => {
    const all = await getWorks();
    const work = all.find((w) => w.slug === slug) ?? null;
    const related = all.filter((w) => w.slug !== slug).slice(0, 2);
    return { work, related };
  };

  if (isDevLocalSnapshotEnabled()) {
    return fromAll();
  }

  const index = await fetchWorksIndexFromCos();
  if (!index || index.slugs.length === 0) {
    return fromAll();
  }

  const relatedSlugs = index.slugs.filter((s) => s !== slug).slice(0, 2);
  const [workRaw, ...relatedRaw] = await Promise.all([
    fetchWorkItemFromCos(slug),
    ...relatedSlugs.map((s) => fetchWorkItemFromCos(s)),
  ]);

  const work =
    workRaw && workRaw.slug ? applyDevMediaUrlsToWorks([workRaw])[0]! : null;
  const related = applyDevMediaUrlsToWorks(
    relatedRaw.filter((item): item is WorkItem => item !== null && !!item.slug),
  );
  return { work, related };
}

// 进程内最近成功缓存：COS 失败（如欠费 451、网络故障）时的兜底层。
// 仅服务端有效；冷启动首次 COS 失败仍会回退到 seedWorks。
let lastSuccessfulWorks: WorkItem[] | null = null;
let lastSuccessfulAt = 0;

async function getWorksRaw(): Promise<WorkItem[]> {
  if (isDevLocalSnapshotEnabled()) {
    const local = await readLocalWorksSnapshot();
    if (local !== null && local.length > 0) {
      return local.map(normalizeWorkMediaUrlsForCos);
    }
  }

  const remote = await fetchWorksFromCos();
  if (remote !== null) {
    lastSuccessfulWorks = remote;
    lastSuccessfulAt = Date.now();
    return remote;
  }

  if (lastSuccessfulWorks && lastSuccessfulWorks.length > 0) {
    const ageSec = Math.round((Date.now() - lastSuccessfulAt) / 1000);
    console.warn(
      `[works-store] COS 读取失败，使用最近成功缓存（age=${ageSec}s, count=${lastSuccessfulWorks.length}）`,
    );
    return lastSuccessfulWorks;
  }

  return seedWorks;
}

async function backupLegacyWorksJsonIfExists(): Promise<void> {
  const current = await fetchLegacyWorksFromCos();
  if (!current || current.length === 0) {
    return;
  }
  await putCosJson(WORKS_JSON_BACKUP_KEY, JSON.stringify(current, null, 2));
}

async function syncLegacyMirror(works: WorkItem[]): Promise<void> {
  const normalized = works.map(normalizeWorkMediaUrlsForCos);
  await putCosJson(WORKS_JSON_KEY, JSON.stringify(normalized, null, 2));
}

async function persistWorkItem(item: WorkItem): Promise<void> {
  const normalized = normalizeWorkMediaUrlsForCos(item);
  await putCosJson(workItemCosKey(normalized.slug), JSON.stringify(normalized, null, 2));
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
  await writeLocalWorksSnapshot(works);
}

export async function saveWorkItemToCos(
  item: WorkItem,
  options?: { previousSlug?: string },
): Promise<void> {
  const previousSlug = options?.previousSlug?.trim();
  const current = await getWorksRaw();
  const normalizedItem = normalizeWorkMediaUrlsForCos(item);

  if (previousSlug && previousSlug !== normalizedItem.slug) {
    await deleteWorkItemFromCos(previousSlug, { skipIndexUpdate: true });
  }

  let merged = current.filter((w) => w.slug !== previousSlug && w.slug !== normalizedItem.slug);
  merged.push(normalizedItem);
  merged = await enforceFeaturedSlots(normalizedItem, merged);
  merged = merged.map(normalizeWorkMediaUrlsForCos);

  await persistWorkItem(normalizedItem);

  const index = await getOrCreateIndex();
  const slugs = index.slugs.filter((s) => s !== previousSlug);
  if (!slugs.includes(normalizedItem.slug)) {
    slugs.push(normalizedItem.slug);
  } else {
    const i = slugs.indexOf(normalizedItem.slug);
    slugs.splice(i, 1);
    slugs.push(normalizedItem.slug);
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

  const normalizedWorks = works.map(normalizeWorkMediaUrlsForCos);

  for (const item of normalizedWorks) {
    await persistWorkItem(item);
  }

  await putCosJson(WORKS_INDEX_KEY, JSON.stringify(buildIndex(slugs), null, 2));
  await syncLegacyMirror(normalizedWorks);
  await persistWorksLocalSnapshot(normalizedWorks);

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
