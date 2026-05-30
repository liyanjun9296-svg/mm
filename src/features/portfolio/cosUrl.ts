/**
 * 根据 COS 对象键生成公有读 URL（需在 .env.local 配置 COS_PUBLIC_BASE_URL 或 Bucket/Region）
 */
export function cosPublicUrl(key: string): string {
  const base =
    process.env.NEXT_PUBLIC_COS_PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "";
  if (!base) {
    return key;
  }
  return `${base}/${key.replace(/^\/+/, "")}`;
}
