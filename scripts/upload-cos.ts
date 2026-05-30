/**
 * 本地上传文件到腾讯云 COS（公有读 Bucket）
 *
 * 用法：
 *   npm run upload:cos -- ./local/video.mp4 works/videos/demo.mp4
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import COS from "cos-nodejs-sdk-v5";
import { config } from "dotenv";

config({ path: ".env.local" });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}，请配置 .env.local`);
  }
  return value;
}

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext] ?? "application/octet-stream";
}

async function main() {
  const [, , localPathArg, cosKeyArg] = process.argv;

  if (!localPathArg || !cosKeyArg) {
    console.error("用法: npm run upload:cos -- <本地文件路径> <COS对象键>");
    console.error("示例: npm run upload:cos -- ./demo.mp4 works/videos/demo.mp4");
    process.exit(1);
  }

  const localPath = path.resolve(localPathArg);
  const cosKey = cosKeyArg.replace(/^\/+/, "");
  const secretId = requireEnv("COS_SECRET_ID");
  const secretKey = requireEnv("COS_SECRET_KEY");
  const bucket = requireEnv("COS_BUCKET");
  const region = requireEnv("COS_REGION");
  const publicBase =
    process.env.COS_PUBLIC_BASE_URL?.replace(/\/+$/, "") ??
    `https://${bucket}.cos.${region}.myqcloud.com`;

  const body = readFileSync(localPath);
  const contentType = guessContentType(localPath);
  const size = statSync(localPath).size;

  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: cosKey,
        Body: body,
        ContentType: contentType,
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

  const publicUrl = `${publicBase}/${cosKey}`;
  console.log("上传成功");
  console.log(`对象键: ${cosKey}`);
  console.log(`大小: ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`公网 URL: ${publicUrl}`);
  console.log("\n将上述 URL 填入 src/features/portfolio/data/works.ts 的 mediaUrl 或 coverImage");
}

main().catch((error) => {
  console.error("上传失败:", error instanceof Error ? error.message : error);
  process.exit(1);
});
