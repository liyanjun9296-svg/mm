/**
 * 同步 COS 作品数据与媒体到 .dev-data/，供本地 dev 零公网下行调试
 *
 * npm run dev:sync              # 仅同步 works.json
 * npm run dev:sync -- --media   # 同步 works + 全部媒体（约 1.4GB 一次性下行）
 * npm run dev:sync -- --media --keys works/videos/foo.mp4  # 增量下载指定对象
 */
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { config } from "dotenv";
import { resolve } from "path";
import COS from "cos-nodejs-sdk-v5";
import { WORKS_INDEX_KEY, WORKS_JSON_KEY, workItemCosKey } from "../src/features/portfolio/constants";
import type { WorkItem } from "../src/features/portfolio/types";
import { collectWorkMediaKeys, normalizeWorkMediaUrlsForCos } from "../src/lib/cos/media-keys";
import {
  DEV_DATA_DIR,
  DEV_MEDIA_DIR,
  DEV_WORKS_FILE,
  localMediaPath,
} from "../src/lib/dev/local-snapshot";
import { createCosClient, formatBytes, requireCosConfig } from "./cos-lib";

config({ path: resolve(process.cwd(), ".env.local") });

function parseArgs(argv: string[]) {
  const media = argv.includes("--media");
  const keys: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--keys" && argv[i + 1]) {
      keys.push(...argv[i + 1].split(",").map((k) => k.trim()).filter(Boolean));
      i++;
    } else if (arg.startsWith("--keys=")) {
      keys.push(...arg.slice("--keys=".length).split(",").map((k) => k.trim()).filter(Boolean));
    }
  }
  return { media, keys };
}

async function getObjectBody(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    cos.getObject({ Bucket: bucket, Region: region, Key: key }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const body = data.Body;
      if (Buffer.isBuffer(body)) {
        resolve(body);
        return;
      }
      if (typeof body === "string") {
        resolve(Buffer.from(body));
        return;
      }
      reject(new Error(`无法读取对象: ${key}`));
    });
  });
}

async function downloadMediaKey(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
): Promise<number> {
  const dest = localMediaPath(key);
  await mkdir(dirname(dest), { recursive: true });
  const body = await getObjectBody(cos, bucket, region, key);
  await writeFile(dest, body);
  return body.length;
}

async function fetchLegacyWorksJson(
  cos: COS,
  bucket: string,
  region: string,
): Promise<WorkItem[]> {
  const raw = await getObjectBody(cos, bucket, region, WORKS_JSON_KEY);
  const data = JSON.parse(raw.toString("utf8")) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`${WORKS_JSON_KEY} 不是有效数组`);
  }
  return (data as WorkItem[]).map(normalizeWorkMediaUrlsForCos);
}

async function fetchWorksFromCosSdk(
  cos: COS,
  bucket: string,
  region: string,
): Promise<WorkItem[]> {
  try {
    const indexRaw = await getObjectBody(cos, bucket, region, WORKS_INDEX_KEY);
    const index = JSON.parse(indexRaw.toString("utf8")) as {
      version?: number;
      slugs?: string[];
    };
    if (index.version === 2 && Array.isArray(index.slugs) && index.slugs.length > 0) {
      const items: WorkItem[] = [];
      for (const slug of index.slugs) {
        try {
          const itemRaw = await getObjectBody(cos, bucket, region, workItemCosKey(slug));
          items.push(JSON.parse(itemRaw.toString("utf8")) as WorkItem);
        } catch {
          // 单条缺失不阻断全量同步
        }
      }
      if (items.length > 0) {
        return items.map(normalizeWorkMediaUrlsForCos);
      }
    }
  } catch {
    // 无索引时回退 legacy
  }

  return fetchLegacyWorksJson(cos, bucket, region);
}

async function main() {
  const { media, keys: extraKeys } = parseArgs(process.argv.slice(2));
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();

  await mkdir(DEV_DATA_DIR, { recursive: true });
  await mkdir(DEV_MEDIA_DIR, { recursive: true });

  console.log("dev:sync — 从 COS 拉取作品快照（优先 site/works/items/*.json）…");
  const works = await fetchWorksFromCosSdk(cos, bucket, region);
  await writeFile(DEV_WORKS_FILE, JSON.stringify(works, null, 2));
  console.log(`已写入 ${DEV_WORKS_FILE}（${works.length} 条作品）`);

  const keysToDownload = new Set<string>(extraKeys.filter((k) => k.startsWith("works/")));

  if (media) {
    for (const work of works) {
      for (const key of collectWorkMediaKeys(work)) {
        keysToDownload.add(key);
      }
    }
  }

  if (keysToDownload.size === 0) {
    console.log("\n未下载媒体。全量媒体请加 --media；增量请加 --keys works/…");
    console.log("请在 .env.local 设置 DEV_USE_LOCAL_SNAPSHOT=1 后 npm run dev");
    return;
  }

  console.log(`\n下载 ${keysToDownload.size} 个媒体对象到 .dev-data/media/ …`);
  let totalBytes = 0;
  let ok = 0;
  let fail = 0;

  for (const key of keysToDownload) {
    try {
      const bytes = await downloadMediaKey(cos, bucket, region, key);
      totalBytes += bytes;
      ok++;
      console.log(`  ✓ ${key} (${formatBytes(bytes)})`);
    } catch (err) {
      fail++;
      console.error(`  ✗ ${key}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n完成：${ok} 成功，${fail} 失败，合计 ${formatBytes(totalBytes)}`);
  console.log("请在 .env.local 设置 DEV_USE_LOCAL_SNAPSHOT=1 后 npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
