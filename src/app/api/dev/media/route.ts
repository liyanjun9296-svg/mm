import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import { extname } from "path";
import { Readable } from "stream";
import { isDevLocalSnapshotEnabled, localMediaPath } from "@/lib/dev/local-snapshot";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

function guessMime(key: string): string {
  const ext = extname(key).toLowerCase();
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isDevLocalSnapshotEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.replace(/^\/+/, "") ?? "";
  if (!key || key.includes("..") || !key.startsWith("works/")) {
    return new Response("Bad Request", { status: 400 });
  }

  const filePath = localMediaPath(key);
  if (!existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  const info = await stat(filePath);
  const stream = createReadStream(filePath);
  const body = Readable.toWeb(stream) as ReadableStream;

  return new Response(body, {
    headers: {
      "Content-Type": guessMime(key),
      "Content-Length": String(info.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
