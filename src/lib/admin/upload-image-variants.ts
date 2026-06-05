import { compressImageForUpload } from "@/lib/admin/compress-image";
import {
  COMPRESSED_VARIANTS,
  mediaBaseFromKey,
  variantKeyFromBase,
} from "@/lib/cos/media-variants";

type UploadRawFn = (token: string, file: File, key: string) => Promise<string>;

export type VariantWarning = {
  variant: "list" | "admin";
  error: unknown;
};

export type VariantWarningCallback = (warning: VariantWarning) => void;

/**
 * 上传图片三档：
 * - detail：**原文件直传**到传入的 detailKey（保留 legacy 命名 + 原扩展名，无二次压缩）
 * - list / admin：浏览器端按档位压缩为 webp，分别上传到 `{base}.{variant}.webp`
 *
 * 返回 detail（原图）的公网 URL；list/admin 任一档失败通过 `onVariantWarning` 上报，
 * 同时仍 resolve（不阻断 detail 成功结果）。
 */
export async function uploadImageVariantsAdmin(
  token: string,
  file: File,
  detailKey: string,
  uploadRaw: UploadRawFn,
  onVariantWarning?: VariantWarningCallback,
): Promise<string> {
  const normalized = detailKey.replace(/^\/+/, "");
  const base = mediaBaseFromKey(normalized);

  // 非 works/ 前缀或无法解析 base：按原 key 直传，不做变体
  if (!base || !base.startsWith("works/")) {
    return uploadRaw(token, file, normalized);
  }

  // 1) detail 原图直传（保留质量）
  const detailUrl = await uploadRaw(token, file, normalized);

  // 2) list / admin 压缩 webp；任一档失败不阻断 detail 的成功结果，由迁移脚本兜底补齐
  const results = await Promise.allSettled(
    COMPRESSED_VARIANTS.map(async (variant) => {
      const compressed = await compressImageForUpload(file, variant);
      const variantKey = variantKeyFromBase(base, variant);
      await uploadRaw(token, compressed, variantKey);
      return variant;
    }),
  );

  results.forEach((res, idx) => {
    if (res.status === "rejected") {
      const variant = COMPRESSED_VARIANTS[idx]!;
      // 压缩档失败不影响 detail；前台 MediaVariantImage 与 AdminThumb 有 onError 回退到 detail，
      // 之后可用 `npm run cos:migrate-images -- --apply` 在服务端 sharp 兜底补齐。
      console.warn(
        `[upload-image-variants] ${variant} 档上传失败 (将由迁移脚本补齐)`,
        res.reason,
      );
      onVariantWarning?.({ variant, error: res.reason });
    }
  });

  return detailUrl;
}
