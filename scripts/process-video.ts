/**
 * 视频「双状态」CLI:把 raw-only 作品的 .original 视频压缩成 1080p H.264 低档,
 * 上传到 `works/videos/{slug}.mp4`,并把 `mediaUrl` 写回 COS。完成后作品转为 dual。
 *
 * 用法:
 *   npm run process:video -- <slug>
 *   npm run process:video -- <slug> --local ~/Desktop/video.mov   # 使用本地文件,零 COS 下行
 *   npm run process:video -- <slug> --force   # 即使作品已是 dual,也重新压缩覆盖低档
 *
 * 本地文件查找顺序(优先级高→低):
 *   1. --local <path> 指定的文件
 *   2. .dev-data/media/{originalKey} (dev:sync 同步过的本地快照)
 *   3. 报错退出(绝不从 COS 下载,零外网下行)
 *
 * 约定:
 *   - 输入:works/videos/{slug}.original.{ext}  (faststart 已生效;由后台 GUI 上传)
 *   - 输出:works/videos/{slug}.mp4              (1080p H.264 CRF 23 + AAC 128k + faststart)
 *   - 单条 ≤ 80MB 是软目标;不达标会打印告警但不阻断
 */
import { existsSync, statSync, unlinkSync, copyFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

import { createCosClient, requireCosConfig, formatBytes } from "./cos-lib";
import {
  fetchWorkItemFromCos,
  saveWorkItemToCos,
} from "../src/features/portfolio/data/works-store";
import { cosKeyFromPublicUrl } from "../src/lib/cos/media-keys";
import { getCosPublicUrl } from "../src/lib/cos/env";

/** .dev-data/media/ 下的本地快照路径 */
function localSnapshotPath(key: string): string {
  return path.join(process.cwd(), ".dev-data", "media", key.replace(/^\/+/, ""));
}

function ensureFfmpeg(): void {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    throw new Error("未找到 ffmpeg, 请先 `brew install ffmpeg`");
  }
}

/**
 * 解析原片到本地临时文件,优先级:
 * 1. --local <path> 指定的文件
 * 2. .dev-data/media/{originalKey} (dev:sync 同步过的本地快照)
 * 3. 报错退出(不会从 COS 下载,零外网下行)
 */
async function resolveOriginalFile(
  key: string,
  dest: string,
  localPath: string | undefined,
): Promise<void> {
  // 1. 用户显式指定本地文件
  if (localPath) {
    const resolved = path.resolve(localPath);
    if (!existsSync(resolved)) {
      throw new Error(`--local 指定的文件不存在: ${resolved}`);
    }
    const size = statSync(resolved).size;
    console.log(`使用本地文件: ${resolved} (${formatBytes(size)})`);
    copyFileSync(resolved, dest);
    return;
  }

  // 2. 检查 .dev-data/media/ 本地快照
  const snapshotFile = localSnapshotPath(key);
  if (existsSync(snapshotFile)) {
    const size = statSync(snapshotFile).size;
    console.log(`使用本地快照: ${snapshotFile} (${formatBytes(size)})`);
    copyFileSync(snapshotFile, dest);
    return;
  }

  // 3. 本地无文件 → 报错退出,绝不从 COS 下载
  throw new Error(
    `本地找不到原片文件。请使用 --local 指定本地路径:\n` +
    `  npm run process:video -- <slug> --local /你的原片路径.mp4\n\n` +
    `或先执行 npm run dev:sync -- --media --keys ${key} 同步到本地快照。`,
  );
}

function compressTo1080p(input: string, output: string): void {
  console.log("压缩 1080p H.264 CRF 23 + AAC 128k + faststart...");
  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-loglevel",
    "error",
    "-stats",
    output,
  ];
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

async function uploadToCos(localPath: string, cosKey: string): Promise<void> {
  const { bucket, region } = requireCosConfig();
  const cos = createCosClient();
  await new Promise<void>((resolve, reject) => {
    cos.sliceUploadFile(
      {
        Bucket: bucket,
        Region: region,
        Key: cosKey,
        FilePath: localPath,
        ContentType: "video/mp4",
        onProgress(info) {
          const pct = (info.percent * 100).toFixed(1);
          const speedMB = (info.speed / 1024 / 1024).toFixed(2);
          process.stdout.write(`\r  上传 ${pct}% @ ${speedMB} MB/s    `);
        },
      },
      (err) => {
        process.stdout.write("\n");
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

export async function processVideo(slug: string, force = false, localPath?: string): Promise<void> {
  ensureFfmpeg();

  const work = await fetchWorkItemFromCos(slug);
  if (!work) {
    throw new Error(`未在 COS 找到 slug=${slug} 的作品 (site/works/items/${slug}.json)`);
  }
  if (work.category !== "video") {
    throw new Error(`作品 ${slug} 不是视频类 (category=${work.category})`);
  }
  if (!work.mediaUrlOriginal) {
    throw new Error(
      `作品 ${slug} 没有 mediaUrlOriginal,无法处理。请先在后台上传原片(GUI)。`,
    );
  }
  if (work.mediaUrl && !force) {
    console.log(`⚠️  作品 ${slug} 已是 dual 状态(mediaUrl 非空),跳过。如要重压缩请加 --force。`);
    return;
  }

  const originalKey = cosKeyFromPublicUrl(work.mediaUrlOriginal);
  if (!originalKey) {
    throw new Error(`mediaUrlOriginal 不是合法的 COS URL: ${work.mediaUrlOriginal}`);
  }

  const ext = path.extname(originalKey) || ".mp4";
  const tempIn = path.join(tmpdir(), `process-video-${slug}-in${ext}`);
  const tempOut = path.join(tmpdir(), `process-video-${slug}-out.mp4`);

  try {
    await resolveOriginalFile(originalKey, tempIn, localPath);
    compressTo1080p(tempIn, tempOut);

    const outSize = statSync(tempOut).size;
    const outMB = outSize / 1024 / 1024;
    console.log(`✅ 压缩完成: ${formatBytes(outSize)}`);
    if (outMB > 80) {
      console.warn(`⚠️  低档大小 ${outMB.toFixed(1)}MB > 80MB 软目标,可考虑手动调高 CRF 或缩短时长。`);
    }

    const lowKey = `works/videos/${slug}.mp4`;
    console.log(`上传 ${lowKey}...`);
    await uploadToCos(tempOut, lowKey);

    const newMediaUrl = getCosPublicUrl(lowKey);
    const updated = { ...work, mediaUrl: newMediaUrl };
    await saveWorkItemToCos(updated);
    console.log(`\n✅ 作品 ${slug} 已转为 dual 状态`);
    console.log(`   mediaUrl         = ${newMediaUrl}`);
    console.log(`   mediaUrlOriginal = ${work.mediaUrlOriginal}`);
  } finally {
    for (const f of [tempIn, tempOut]) {
      if (existsSync(f)) {
        try {
          unlinkSync(f);
        } catch {
          // 忽略清理失败
        }
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith("--"));
  const force = args.includes("--force");

  // 解析 --local <path>
  let localPath: string | undefined;
  const localIdx = args.indexOf("--local");
  if (localIdx !== -1 && args[localIdx + 1]) {
    localPath = args[localIdx + 1];
  }

  if (!slug) {
    console.error("用法: npm run process:video -- <slug> [--local <文件路径>] [--force]");
    process.exit(1);
  }

  await processVideo(slug, force, localPath);
}

// 仅当作为入口运行时执行 main;被 reprocess-videos.ts 引用时不触发
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath.endsWith("process-video.ts")) {
  main().catch((err) => {
    console.error("\n失败:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
