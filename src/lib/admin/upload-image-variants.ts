import { compressImageForUpload } from "@/lib/admin/compress-image";
import {
  MEDIA_VARIANTS,
  mediaBaseFromKey,
  variantKeyFromBase,
} from "@/lib/cos/media-variants";

type UploadRawFn = (token: string, file: File, key: string) => Promise<string>;

/** 压缩并上传 list / admin / detail 三档，返回 detail 公网 URL */
export async function uploadImageVariantsAdmin(
  token: string,
  file: File,
  detailKey: string,
  uploadRaw: UploadRawFn,
): Promise<string> {
  const normalized = detailKey.replace(/^\/+/, "");
  const base = mediaBaseFromKey(normalized) ?? normalized.replace(/\.detail\.webp$/i, "");

  if (!base.startsWith("works/")) {
    return uploadRaw(token, file, normalized);
  }

  let detailUrl = "";

  for (const variant of MEDIA_VARIANTS) {
    const compressed = await compressImageForUpload(file, variant);
    const key = variantKeyFromBase(base, variant);
    const url = await uploadRaw(token, compressed, key);
    if (variant === "detail") {
      detailUrl = url;
    }
  }

  if (!detailUrl) {
    throw new Error("图片三档上传失败");
  }

  return detailUrl;
}
