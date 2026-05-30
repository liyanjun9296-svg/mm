/**
 * 更新 COS Bucket CORS，加入本地 + Vercel + 自定义域名 Origin
 *
 * 用法：
 *   npm run cos:cors
 *   SITE_DOMAIN=yourdomain.com npm run cos:cors
 *   SITE_DOMAIN=yourdomain.com VERCEL_URL=mm.vercel.app npm run cos:cors
 */
import { config } from "dotenv";
import COS from "cos-nodejs-sdk-v5";

config({ path: ".env.local" });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

function buildOrigins(): string[] {
  const origins = new Set<string>(["http://localhost:3000"]);

  const siteDomain = process.env.SITE_DOMAIN?.trim();
  if (siteDomain) {
    origins.add(`https://${siteDomain.replace(/^https?:\/\//, "")}`);
    origins.add(`https://www.${siteDomain.replace(/^https?:\/\//, "").replace(/^www\./, "")}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    origins.add(`https://${host}`);
  }

  return [...origins];
}

async function main() {
  const bucket = requireEnv("COS_BUCKET");
  const region = requireEnv("COS_REGION");
  const secretId = requireEnv("COS_SECRET_ID");
  const secretKey = requireEnv("COS_SECRET_KEY");

  const allowedOrigins = buildOrigins();

  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

  await new Promise<void>((resolve, reject) => {
    cos.putBucketCors(
      {
        Bucket: bucket,
        Region: region,
        CORSRules: [
          {
            AllowedOrigin: allowedOrigins,
            AllowedMethod: ["GET", "PUT", "HEAD"],
            AllowedHeader: ["*"],
            ExposeHeader: ["ETag", "Content-Length"],
            MaxAgeSeconds: 600,
          },
        ],
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

  console.log("COS CORS 已更新，AllowedOrigin：");
  for (const origin of allowedOrigins) {
    console.log(`  - ${origin}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
