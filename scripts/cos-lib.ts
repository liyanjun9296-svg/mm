import { config } from "dotenv";
import { resolve } from "path";
import COS from "cos-nodejs-sdk-v5";
import type { WorkItem } from "../src/features/portfolio/types";
import { collectWorkMediaKeys } from "../src/lib/cos/media-keys";
import { expandMediaKeysWithVariants } from "../src/lib/cos/media-variants";

config({ path: resolve(process.cwd(), ".env.local") });

export type CosObjectRow = {
  Key: string;
  Size: number;
  VersionId?: string;
  IsLatest?: boolean;
};

export function requireCosConfig() {
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  if (!bucket || !region || !secretId || !secretKey) {
    throw new Error("COS 未配置：请在 .env.local 填写 COS_*");
  }
  return { bucket, region, secretId, secretKey };
}

export function createCosClient() {
  const { secretId, secretKey } = requireCosConfig();
  return new COS({ SecretId: secretId, SecretKey: secretKey });
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function parseArgs(argv: string[]) {
  const apply = argv.includes("--apply");
  const json = argv.includes("--json");
  const prefixArg = argv.find((a) => a.startsWith("--prefix="));
  const prefix = prefixArg?.slice("--prefix=".length) ?? "";
  return { apply, json, prefix };
}

export async function listCurrentObjects(
  cos: COS,
  bucket: string,
  region: string,
  prefix?: string,
): Promise<CosObjectRow[]> {
  const rows: CosObjectRow[] = [];
  let marker = "";

  for (let page = 0; page < 200; page++) {
    const data = await new Promise<COS.GetBucketResult>((res, rej) => {
      cos.getBucket(
        {
          Bucket: bucket,
          Region: region,
          Prefix: prefix,
          MaxKeys: 1000,
          Marker: marker,
        },
        (err, result) => (err ? rej(err) : res(result)),
      );
    });

    for (const item of data.Contents ?? []) {
      if (!item.Key || item.Key.endsWith("/")) continue;
      rows.push({
        Key: item.Key,
        Size: Number(item.Size ?? 0),
        IsLatest: true,
      });
    }

    if (!data.IsTruncated) break;
    marker = data.NextMarker ?? "";
    if (!marker) break;
  }

  return rows;
}

export async function listNonCurrentVersions(
  cos: COS,
  bucket: string,
  region: string,
  prefix: string,
): Promise<CosObjectRow[]> {
  const rows: CosObjectRow[] = [];
  let keyMarker = "";
  let versionIdMarker = "";

  for (let page = 0; page < 200; page++) {
    const data = await new Promise<COS.ListObjectVersionsResult>((res, rej) => {
      cos.listObjectVersions(
        {
          Bucket: bucket,
          Region: region,
          Prefix: prefix,
          MaxKeys: 500,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker,
        },
        (err, result) => (err ? rej(err) : res(result)),
      );
    });

    for (const item of data.Versions ?? []) {
      if (!item.Key || item.Key.endsWith("/")) continue;
      if (item.IsLatest === "true" || item.IsLatest === true) continue;
      rows.push({
        Key: item.Key,
        Size: Number(item.Size ?? 0),
        VersionId: item.VersionId,
        IsLatest: false,
      });
    }

    for (const marker of data.DeleteMarkers ?? []) {
      if (!marker.Key || !marker.VersionId) continue;
      rows.push({
        Key: marker.Key,
        Size: 0,
        VersionId: marker.VersionId,
        IsLatest: false,
      });
    }

    if (!data.IsTruncated) break;
    keyMarker = data.NextKeyMarker ?? "";
    versionIdMarker = data.NextVersionIdMarker ?? "";
    if (!keyMarker && !versionIdMarker) break;
  }

  return rows;
}

export async function loadReferencedMediaKeys(): Promise<{
  works: WorkItem[];
  keys: Set<string>;
}> {
  const { getWorks } = await import("../src/features/portfolio/data/works-store");
  const works = await getWorks();
  const rawKeys: string[] = [];
  for (const work of works) {
    for (const key of collectWorkMediaKeys(work)) {
      rawKeys.push(key);
    }
  }
  // 把图片 detail key 展开为 detail + list.webp + admin.webp，避免压缩档被误判为孤儿
  const keys = new Set<string>(expandMediaKeysWithVariants(rawKeys));
  return { works, keys };
}

const PRUNE_PREFIXES = ["works/videos/", "works/gallery/", "works/covers/"];

export function isPrunableMediaKey(key: string): boolean {
  return PRUNE_PREFIXES.some((p) => key.startsWith(p));
}

export async function deleteObjectVersion(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
  versionId?: string,
): Promise<void> {
  await new Promise<void>((res, rej) => {
    cos.deleteObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        ...(versionId ? { VersionId: versionId } : {}),
      },
      (err) => (err ? rej(err) : res()),
    );
  });
}

export function summarizeByPrefix(objects: CosObjectRow[]) {
  const map: Record<string, { count: number; bytes: number }> = {};
  for (const o of objects) {
    const parts = o.Key.split("/");
    const prefix =
      parts.length >= 2 ? `${parts.slice(0, 2).join("/")}/` : `${parts[0]}/`;
    if (!map[prefix]) map[prefix] = { count: 0, bytes: 0 };
    map[prefix].count++;
    map[prefix].bytes += o.Size;
  }
  return map;
}
