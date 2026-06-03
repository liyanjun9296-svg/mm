import {
  WORKS_INDEX_KEY,
  WORKS_JSON_KEY,
  workItemCosKey,
} from "../../constants";
import type { WorkItem } from "../../types";
import { fetchJsonFromCos } from "./cos-io";

export type WorksIndex = {
  version: 2;
  slugs: string[];
  updatedAt: string;
};

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
  const perSlug = await fetchWorksFromCosPerSlug();
  if (perSlug !== null && perSlug.length > 0) {
    return perSlug;
  }

  const legacy = await fetchLegacyWorksFromCos();
  if (legacy && legacy.length > 0) {
    return legacy;
  }
  return null;
}

export function buildIndex(slugs: string[]): WorksIndex {
  const unique = [...new Set(slugs.filter(Boolean))];
  return {
    version: 2,
    slugs: unique,
    updatedAt: new Date().toISOString(),
  };
}

export async function getOrCreateIndex(): Promise<WorksIndex> {
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
