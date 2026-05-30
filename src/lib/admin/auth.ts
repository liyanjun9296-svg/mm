import { getCosEnv } from "@/lib/cos/env";

export function verifyAdminToken(request: Request): boolean {
  const env = getCosEnv();
  if (!env?.adminUploadToken) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  return bearerToken === env.adminUploadToken;
}

export function unauthorizedResponse() {
  return Response.json({ error: "未授权" }, { status: 401 });
}
