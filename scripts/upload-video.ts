/**
 * 上传视频到 COS,自动 faststart(无损)。
 *
 * 用法:
 *   npm run upload:video -- <本地视频路径> <作品 slug>
 *
 * 示例:
 *   npm run upload:video -- ./demo.mp4 my-new-video
 *   → 自动检测 moov 位置,必要时 ffmpeg -movflags +faststart
 *   → 上传到 works/videos/my-new-video.{ext}
 *   → 打印新的 mediaUrl,你在后台粘贴即可
 *
 * 设计目标:**永远不会上传 moov 在末尾的坏视频**,杜绝浏览器 Range 死循环。
 */
import { existsSync, openSync, readSync, closeSync, statSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import COS from "cos-nodejs-sdk-v5";
import { config } from "dotenv";

config({ path: ".env.local" });

const VIDEO_EXT_TO_TYPE: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}, 请在 .env.local 中配置`);
  }
  return value;
}

function safeSlug(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
}

function ensureFfmpeg(): void {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    throw new Error("未找到 ffmpeg, 请先 `brew install ffmpeg`");
  }
}

/**
 * 检测 mp4/mov 的 moov atom 是否在文件头部(faststart 已生效)。
 * 简单算法:扫描前 256KB,如果找到 "moov" 字串则视为已优化。
 */
function isMoovAtFront(filePath: string): boolean {
  const fd = openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(262144); // 256 KB
    const bytes = readSync(fd, buf, 0, buf.length, 0);
    return buf.subarray(0, bytes).indexOf("moov") !== -1;
  } finally {
    closeSync(fd);
  }
}

function runFaststart(input: string, output: string): void {
  const args = [
    "-y",
    "-i",
    input,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    output,
    "-loglevel",
    "error",
  ];
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

async function uploadToCos(
  cos: COS,
  bucket: string,
  region: string,
  filePath: string,
  cosKey: string,
  contentType: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    cos.sliceUploadFile(
      {
        Bucket: bucket,
        Region: region,
        Key: cosKey,
        FilePath: filePath,
        ContentType: contentType,
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

async function main() {
  const [, , localPathArg, slugArg] = process.argv;

  if (!localPathArg || !slugArg) {
    console.error("用法: npm run upload:video -- <本地视频路径> <作品 slug>");
    console.error("示例: npm run upload:video -- ./demo.mp4 my-new-video");
    process.exit(1);
  }

  const localPath = path.resolve(localPathArg);
  if (!existsSync(localPath)) {
    throw new Error(`文件不存在: ${localPath}`);
  }

  const ext = path.extname(localPath).toLowerCase();
  const contentType = VIDEO_EXT_TO_TYPE[ext];
  if (!contentType) {
    throw new Error(`不支持的视频扩展名: ${ext} (仅支持 .mp4 .m4v .mov .webm)`);
  }

  const slug = safeSlug(slugArg);
  if (!slug) {
    throw new Error(`非法 slug: "${slugArg}"`);
  }

  const cosKey = `works/videos/${slug}${ext}`;
  const bucket = requireEnv("COS_BUCKET");
  const region = requireEnv("COS_REGION");
  const secretId = requireEnv("COS_SECRET_ID");
  const secretKey = requireEnv("COS_SECRET_KEY");
  const publicBase =
    process.env.COS_PUBLIC_BASE_URL?.replace(/\/+$/, "") ??
    `https://${bucket}.cos.${region}.myqcloud.com`;

  const sizeMB = (statSync(localPath).size / 1024 / 1024).toFixed(1);
  console.log(`输入: ${localPath} (${sizeMB} MB)`);
  console.log(`目标: ${cosKey}`);

  ensureFfmpeg();

  // Step 1: 检测 moov 位置, 决定是否需要 faststart
  let uploadFrom = localPath;
  let tempFile: string | null = null;

  if (isMoovAtFront(localPath)) {
    console.log("✅ moov 已在头部, 跳过 ffmpeg 处理");
  } else {
    console.log("⚠️  moov 在末尾, 用 ffmpeg 重排 (无损)...");
    tempFile = path.join(tmpdir(), `faststart-${Date.now()}${ext}`);
    runFaststart(localPath, tempFile);
    if (!isMoovAtFront(tempFile)) {
      throw new Error("faststart 后仍未检测到 moov 在头部, 视频文件可能损坏");
    }
    uploadFrom = tempFile;
    const fixedSizeMB = (statSync(tempFile).size / 1024 / 1024).toFixed(1);
    console.log(`✅ ffmpeg 处理完成 (${fixedSizeMB} MB)`);
  }

  // Step 2: 上传 COS
  console.log("\n开始上传到 COS...");
  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });
  await uploadToCos(cos, bucket, region, uploadFrom, cosKey, contentType);

  if (tempFile) {
    try {
      unlinkSync(tempFile);
    } catch {
      // 忽略清理失败
    }
  }

  const publicUrl = `${publicBase}/${cosKey}`;
  console.log("\n上传完成 ✅");
  console.log(`mediaUrl: ${publicUrl}`);
  console.log("\n下一步:");
  console.log(`  1. 打开 /zh/admin, 找到 slug=${slug} 的作品 (没有就新建)`);
  console.log(`  2. 把 mediaUrl 粘贴到「视频地址」字段, 保存`);
  console.log(`  3. 上线后访问 /zh/works/${slug} 验证`);
}

main().catch((err) => {
  console.error("\n失败:", err instanceof Error ? err.message : err);
  process.exit(1);
});
