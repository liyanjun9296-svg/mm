/**
 * 视频「双状态」CLI:把 raw-only 作品的 .original 视频压缩成 1080p H.264 低档,
 * 上传到 `works/videos/{slug}.mp4`,并把 `mediaUrl` 写回 COS。完成后作品转为 dual。
 *
 * 用法:
 *   npm run process:video -- <slug>
 *   npm run process:video -- <slug> --force   # 即使作品已是 dual,也重新压缩覆盖低档
 *
 * 不接受本地文件参数 — 数据源永远来自 COS 的 `mediaUrlOriginal`。
 *
 * 约定:
 *   - 输入:works/videos/{slug}.original.{ext}  (faststart 已生效;由后台 GUI 上传)
 *   - 输出:works/videos/{slug}.mp4              (1080p H.264 CRF 23 + AAC 128k + faststart)
 *   - 单条 ≤ 80MB 是软目标;不达标会打印告警但不阻断
 */
import { existsSync, statSync, unlinkSync, createWriteStream } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { createCosClient, requireCosConfig, formatBytes } from "./cos-lib";
import {
  fetchWorkItemFromCos,
  saveWorkItemToCos,
} from "../src/features/portfolio/data/works-store";
import { cosKeyFromPublicUrl } from "../src/lib/cos/media-keys";
import { getCosPublicUrl } from "../src/lib/cos/env";

function ensureFfmpeg(): void {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    throw new Error("未找到 ffmpeg, 请先 `brew install ffmpeg`");
  }
}

async function downloadFromCos(key: string, dest: string): Promise<void> {
  const { bucket, region } = requireCosConfig();
  const url = getCosPublicUrl(key);
  console.log(`下载 ${key}...`);
  console.log(`  URL: ${url}`);
  // 用公网 URL 直连下载 (公有读),省去签名烦恼
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`下载失败 ${res.status} ${res.statusText} (bucket=${bucket} region=${region})`);
  }
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest));
  const size = statSync(dest).size;
  console.log(`  ✅ ${formatBytes(size)} → ${dest}`);
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

export async function processVideo(slug: string, force = false): Promise<void> {
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
    await downloadFromCos(originalKey, tempIn);
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

  if (!slug) {
    console.error("用法: npm run process:video -- <slug> [--force]");
    process.exit(1);
  }

  await processVideo(slug, force);
}

// 仅当作为入口运行时执行 main;被 reprocess-videos.ts 引用时不触发
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entryPath.endsWith("process-video.ts")) {
  main().catch((err) => {
    console.error("\n失败:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
