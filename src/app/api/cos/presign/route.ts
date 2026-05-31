import { NextResponse } from "next/server";
import { getCosEnv } from "@/lib/cos/env";
import { getPresignedPutUrl } from "@/lib/cos/server";
import { isAllowedWorksUploadKey } from "@/lib/cos/upload-keys";

type PresignBody = {
  key?: string;
  contentType?: string;
  token?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "未授权" }, { status: 401 });
}

export async function POST(request: Request) {
  const env = getCosEnv();
  if (!env) {
    return NextResponse.json(
      { error: "COS 未配置，请先在 .env.local 填写密钥与 Bucket" },
      { status: 503 },
    );
  }

  if (!env.adminUploadToken) {
    return NextResponse.json(
      { error: "未设置 ADMIN_UPLOAD_TOKEN，无法使用管理上传" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  let body: PresignBody;
  try {
    body = (await request.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const token = bearerToken ?? body.token;
  if (token !== env.adminUploadToken) {
    return unauthorized();
  }

  const key = body.key?.trim();
  const contentType = body.contentType?.trim();

  if (!key || !contentType) {
    return NextResponse.json(
      { error: "缺少 key 或 contentType" },
      { status: 400 },
    );
  }

  if (key.includes("..")) {
    return NextResponse.json({ error: "对象键不合法" }, { status: 400 });
  }

  if (!isAllowedWorksUploadKey(key)) {
    return NextResponse.json(
      { error: "对象键必须以 works/ 开头（如 works/videos/demo.mp4）" },
      { status: 400 },
    );
  }

  try {
    const result = await getPresignedPutUrl({ key, contentType });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "预签名失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
