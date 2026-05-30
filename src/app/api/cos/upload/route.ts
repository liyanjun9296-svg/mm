import { NextResponse } from "next/server";
import { getCosEnv, getCosPublicUrl } from "@/lib/cos/env";
import { createCosClient } from "@/lib/cos/server";

function unauthorized() {
  return NextResponse.json({ error: "未授权" }, { status: 401 });
}

function sanitizeKey(raw: string): string {
  return raw.replace(/^\/+/, "").replace(/\.\./g, "");
}

export async function POST(request: Request) {
  const env = getCosEnv();
  if (!env) {
    return NextResponse.json(
      { error: "COS 未配置，请检查 .env.local" },
      { status: 503 },
    );
  }

  if (!env.adminUploadToken) {
    return NextResponse.json(
      { error: "未设置 ADMIN_UPLOAD_TOKEN" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const formData = await request.formData();
  const token = bearerToken ?? String(formData.get("token") ?? "");
  if (token !== env.adminUploadToken) {
    return unauthorized();
  }

  const file = formData.get("file");
  const keyRaw = formData.get("key");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  if (typeof keyRaw !== "string" || !keyRaw.trim()) {
    return NextResponse.json({ error: "缺少对象键 key" }, { status: 400 });
  }

  const key = sanitizeKey(keyRaw);
  const contentType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const cos = createCosClient();
    await new Promise<void>((resolve, reject) => {
      cos.putObject(
        {
          Bucket: env.bucket,
          Region: env.region,
          Key: key,
          Body: buffer,
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

    return NextResponse.json({
      publicUrl: getCosPublicUrl(key),
      key,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
