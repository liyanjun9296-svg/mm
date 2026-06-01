import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { NextResponse } from "next/server";
import type COS from "cos-nodejs-sdk-v5";
import { unauthorizedResponse, verifyAdminToken } from "@/lib/admin/auth";
import { revalidateSiteContent } from "@/lib/admin/revalidate-site";
import { createCosClient } from "@/lib/cos/server";
import { getCosEnv } from "@/lib/cos/env";
import { collectWorkMediaKeys } from "@/lib/cos/media-keys";
import { fetchWorksFromCos } from "@/features/portfolio/data/works-store";
import {
  hasLocalMediaFile,
  isDevLocalSnapshotEnabled,
  localMediaPath,
  writeLocalWorksSnapshot,
} from "@/lib/dev/local-snapshot";

/**
 * POST /api/admin/dev/pull
 *
 * 仅本地 dev + DEV_USE_LOCAL_SNAPSHOT=1 可用：
 * 从 COS 拉取最新 works.json 并增量下载缺失媒体到 .dev-data/。
 * 用于多人协作场景：队友上传后，本机点一下即可同步看到。
 */
export async function POST(request: Request) {
  // 生产环境硬阻断（双重保险：即使误设 NODE_ENV/DEV_USE_LOCAL_SNAPSHOT 也不会走到这里）
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "该接口仅本地开发可用" },
      { status: 400 },
    );
  }

  if (!isDevLocalSnapshotEnabled()) {
    return NextResponse.json(
      { error: "请先在 .env.local 设置 DEV_USE_LOCAL_SNAPSHOT=1 并重启 dev" },
      { status: 400 },
    );
  }

  if (!verifyAdminToken(request)) {
    return unauthorizedResponse();
  }

  const env = getCosEnv();
  if (!env) {
    return NextResponse.json({ error: "COS 未配置" }, { status: 500 });
  }

  // 1. 直接从 COS 读最新作品（fetchWorksFromCos 内部不走本地快照）
  const works = await fetchWorksFromCos();
  if (works === null) {
    return NextResponse.json(
      { error: "从 COS 读取作品失败（网络或欠费 451？）" },
      { status: 502 },
    );
  }

  // 2. 写穿本地快照
  await writeLocalWorksSnapshot(works);

  // 3. 收集缺失媒体并增量下载
  const allKeys = new Set<string>();
  for (const work of works) {
    for (const key of collectWorkMediaKeys(work)) {
      allKeys.add(key);
    }
  }

  const missingKeys = [...allKeys].filter((key) => !hasLocalMediaFile(key));
  const downloaded: string[] = [];
  const failed: { key: string; error: string }[] = [];

  if (missingKeys.length > 0) {
    const cos = createCosClient();
    for (const key of missingKeys) {
      try {
        await downloadMediaKey(cos, env.bucket, env.region, key);
        downloaded.push(key);
      } catch (err) {
        failed.push({
          key,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // 4. 清前台缓存
  revalidateSiteContent();

  return NextResponse.json({
    ok: true,
    worksCount: works.length,
    mediaDownloaded: downloaded.length,
    mediaSkipped: allKeys.size - missingKeys.length,
    mediaFailed: failed,
  });
}

async function downloadMediaKey(
  cos: COS,
  bucket: string,
  region: string,
  key: string,
): Promise<void> {
  const dest = localMediaPath(key);
  await mkdir(dirname(dest), { recursive: true });
  const body = await getObjectBody(cos, bucket, region, key);
  await writeFile(dest, body);
}

function getObjectBody(
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
