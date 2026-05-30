import COS from "cos-nodejs-sdk-v5";
import { getCosEnv, getCosPublicUrl, requireCosEnv } from "./env";

export function createCosClient(): COS {
  const env = requireCosEnv();
  return new COS({
    SecretId: env.secretId,
    SecretKey: env.secretKey,
  });
}

type PresignPutOptions = {
  key: string;
  contentType: string;
  expiresSeconds?: number;
};

export async function getPresignedPutUrl({
  key,
  contentType,
  expiresSeconds = 900,
}: PresignPutOptions): Promise<{ uploadUrl: string; publicUrl: string }> {
  const env = requireCosEnv();
  const cos = createCosClient();
  const normalizedKey = key.replace(/^\/+/, "");

  const uploadUrl = await new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: env.bucket,
        Region: env.region,
        Method: "PUT",
        Key: normalizedKey,
        Sign: true,
        Expires: expiresSeconds,
        Headers: {
          "Content-Type": contentType,
        },
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data.Url);
      },
    );
  });

  return {
    uploadUrl,
    publicUrl: getCosPublicUrl(normalizedKey),
  };
}

export function isCosConfigured(): boolean {
  return getCosEnv() !== null;
}
