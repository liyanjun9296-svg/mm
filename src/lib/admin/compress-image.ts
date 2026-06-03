import type { MediaVariant } from "@/lib/cos/media-variants";

type CompressVariant = Exclude<MediaVariant, "detail">;

const PRESETS: Record<CompressVariant, { maxWidth: number; quality: number }> = {
  list: { maxWidth: 1200, quality: 0.85 },
  admin: { maxWidth: 120, quality: 0.8 },
};

const SKIP_IF_UNDER_BYTES = 400 * 1024;

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function loadImageWithOrientation(file: File): Promise<LoadedImage> {
  // 优先使用 createImageBitmap：现代浏览器（Chrome / Firefox / Safari 16+）会按 EXIF
  // orientation 正向解码，避免 iPhone 竖拍图被横放。
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close?.(),
      };
    } catch {
      // 降级走 <img>
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        release: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法读取图片：${file.name}`));
    };
    img.src = url;
  });
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片压缩失败"));
          return;
        }
        const baseName = fileName.replace(/\.[^.]+$/, "") || "image";
        resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
      },
      "image/webp",
      quality,
    );
  });
}

/**
 * 浏览器端按档位压缩图片为 WebP。
 *
 * 仅用于 `list` / `admin` 档；`detail` 档使用原图直传（见 `upload-image-variants.ts`）。
 */
export async function compressImageForUpload(
  file: File,
  variant: CompressVariant,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const preset = PRESETS[variant];
  if (!preset) {
    // 类型上已被排除；运行时若被错误调用，安全降级为原文件。
    return file;
  }
  const { maxWidth, quality } = preset;

  let loaded: LoadedImage;
  try {
    loaded = await loadImageWithOrientation(file);
  } catch {
    return file;
  }

  try {
    const scale = loaded.width > maxWidth ? maxWidth / loaded.width : 1;
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));

    // 已经是较小的 webp 时，admin 档以外仍可直接复用原文件
    if (
      scale === 1 &&
      file.size < SKIP_IF_UNDER_BYTES &&
      file.type === "image/webp"
    ) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    ctx.drawImage(loaded.source, 0, 0, width, height);

    try {
      return await canvasToFile(canvas, file.name, quality);
    } catch {
      return file;
    }
  } finally {
    loaded.release();
  }
}
