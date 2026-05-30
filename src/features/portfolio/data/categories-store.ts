import {
  DEFAULT_PHOTO_CATEGORIES,
  DEFAULT_VIDEO_CATEGORIES,
  PHOTO_CATEGORIES_CACHE_TAG,
  PHOTO_CATEGORIES_JSON_KEY,
  VIDEO_CATEGORIES_CACHE_TAG,
  VIDEO_CATEGORIES_JSON_KEY,
} from "../constants";
import { getCosEnv, getCosPublicUrl } from "@/lib/cos/env";
import { createCosClient } from "@/lib/cos/server";

function parseCategories(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

export async function fetchVideoCategoriesFromCos(): Promise<string[] | null> {
  const env = getCosEnv();
  if (!env) {
    return null;
  }

  const url = getCosPublicUrl(VIDEO_CATEGORIES_JSON_KEY);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: [VIDEO_CATEGORIES_CACHE_TAG] },
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as unknown;
    const parsed = parseCategories(json);
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function getVideoCategories(): Promise<string[]> {
  const remote = await fetchVideoCategoriesFromCos();
  if (remote) {
    return remote;
  }
  return [...DEFAULT_VIDEO_CATEGORIES];
}

export async function saveVideoCategoriesToCos(categories: string[]): Promise<void> {
  const env = getCosEnv();
  if (!env) {
    throw new Error("COS 未配置");
  }

  const normalized = categories
    .map((c) => c.trim())
    .filter(Boolean);
  const unique = [...new Set(normalized)];

  if (unique.length === 0) {
    throw new Error("至少保留一个分类");
  }

  const cos = createCosClient();
  const body = JSON.stringify(unique, null, 2);

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: env.bucket,
        Region: env.region,
        Key: VIDEO_CATEGORIES_JSON_KEY,
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

export async function fetchPhotoCategoriesFromCos(): Promise<string[] | null> {
  const env = getCosEnv();
  if (!env) {
    return null;
  }

  const url = getCosPublicUrl(PHOTO_CATEGORIES_JSON_KEY);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: [PHOTO_CATEGORIES_CACHE_TAG] },
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as unknown;
    const parsed = parseCategories(json);
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function getPhotoCategories(): Promise<string[]> {
  const remote = await fetchPhotoCategoriesFromCos();
  if (remote) {
    return remote;
  }
  return [...DEFAULT_PHOTO_CATEGORIES];
}

export async function savePhotoCategoriesToCos(categories: string[]): Promise<void> {
  const env = getCosEnv();
  if (!env) {
    throw new Error("COS 未配置");
  }

  const normalized = categories.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(normalized)];

  if (unique.length === 0) {
    throw new Error("至少保留一个分类");
  }

  const cos = createCosClient();
  const body = JSON.stringify(unique, null, 2);

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: env.bucket,
        Region: env.region,
        Key: PHOTO_CATEGORIES_JSON_KEY,
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

export { DEFAULT_PHOTO_CATEGORIES, DEFAULT_VIDEO_CATEGORIES };
