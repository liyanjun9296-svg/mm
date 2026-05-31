/** COS 上传对象键校验（仅允许作品媒体目录） */
export function isAllowedWorksUploadKey(key: string): boolean {
  const normalized = key.replace(/^\/+/, "");
  return normalized.startsWith("works/") && !normalized.includes("..");
}

export function sanitizeUploadKey(raw: string): string {
  return raw.replace(/^\/+/, "").replace(/\.\./g, "");
}
