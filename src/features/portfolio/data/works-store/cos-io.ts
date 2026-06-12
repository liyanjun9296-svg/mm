import { getCosEnv, getCosPublicUrl } from "@/lib/cos/env";
import { createCosClient } from "@/lib/cos/server";
import { WORKS_CACHE_TAG } from "../../constants";

export function getWorksPublicUrl(key: string): string | null {
  const env = getCosEnv();
  if (!env) {
    return null;
  }
  return getCosPublicUrl(key);
}

export async function fetchJsonFromCos<T>(key: string): Promise<T | null> {
  const url = getWorksPublicUrl(key);
  if (!url) {
    return null;
  }
  try {
    // revalidate 交由页面级声明控制(首页/portfolio 300s,详情页 3600s),
    // 后台保存时 revalidateTag(WORKS_CACHE_TAG) 主动失效,不会滞留旧数据。
    const res = await fetch(url, {
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

export async function putCosJson(key: string, body: string): Promise<void> {
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

export async function deleteCosObject(key: string): Promise<void> {
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
