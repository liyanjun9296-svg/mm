import type { MediaVariant } from "@/lib/cos/media-variants";

const PRESETS: Record<MediaVariant, { maxWidth: number; quality: number }> = {
  list: { maxWidth: 1200, quality: 0.85 },
  admin: { maxWidth: 120, quality: 0.8 },
  detail: { maxWidth: 2400, quality: 0.88 },
};

const SKIP_IF_UNDER_BYTES = 400 * 1024;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
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

/** 浏览器端按档位压缩图片，输出 WebP File */
export async function compressImageForUpload(
  file: File,
  variant: MediaVariant,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const { maxWidth, quality } = PRESETS[variant];

  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch {
    return file;
  }

  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  if (
    variant !== "detail" &&
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
  ctx.drawImage(img, 0, 0, width, height);

  try {
    return await canvasToFile(canvas, file.name, quality);
  } catch {
    return file;
  }
}
