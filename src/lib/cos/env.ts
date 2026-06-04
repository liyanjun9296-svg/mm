export type CosEnv = {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicBaseUrl: string;
  adminUploadToken: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Resolve just the public base URL — works on both server and client (uses NEXT_PUBLIC_ fallback). */
export function getCosPublicBaseUrl(): string | null {
  const explicit =
    process.env.COS_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL;
  if (explicit) {
    return trimTrailingSlash(explicit);
  }
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  if (bucket && region) {
    return `https://${bucket}.cos.${region}.myqcloud.com`;
  }
  return null;
}

export function getCosEnv(): CosEnv | null {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;

  if (!secretId || !secretKey || !bucket || !region) {
    return null;
  }

  const publicBaseUrl = trimTrailingSlash(
    process.env.COS_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL ??
      `https://${bucket}.cos.${region}.myqcloud.com`,
  );

  return {
    secretId,
    secretKey,
    bucket,
    region,
    publicBaseUrl,
    adminUploadToken: process.env.ADMIN_UPLOAD_TOKEN ?? "",
  };
}

export function requireCosEnv(): CosEnv {
  const env = getCosEnv();
  if (!env) {
    throw new Error(
      "COS 未配置：请在 .env.local 中设置 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION",
    );
  }
  return env;
}

export function getCosPublicUrl(key: string): string {
  const env = getCosEnv();
  if (!env) {
    return key;
  }
  const normalizedKey = key.replace(/^\/+/, "");
  return `${env.publicBaseUrl}/${normalizedKey}`;
}

export function getCosHostname(): string | null {
  const env = getCosEnv();
  if (!env) {
    return null;
  }
  try {
    return new URL(env.publicBaseUrl).hostname;
  } catch {
    return null;
  }
}
