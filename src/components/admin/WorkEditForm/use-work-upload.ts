"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkCategory, WorkItem } from "@/features/portfolio/types";
import {
  confirmMediaOverwrite,
  confirmVideoUpload,
  formatUploadFailure,
  resolveUploadSlug,
  uploadFileAdmin,
  workMediaKey,
  type WorkMediaKind,
} from "@/lib/admin/api";

export const emptyWork = (category: WorkCategory): WorkItem => ({
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  category,
  subcategory: category === "video" ? "产品" : undefined,
  duration: "",
  coverImage: "",
  mediaUrl: "",
  mediaUrlOriginal: undefined,
  role: "",
  year: new Date().getFullYear().toString(),
  platform: "",
  externalUrl: "",
  detailImages: [],
  featured: false,
});

export type StatusTone = "info" | "success" | "error";
export type SetStatus = (message: string, tone?: StatusTone) => void;

export type UploadOptions = {
  existingUrl?: string;
  fieldLabel?: string;
  detailIndex?: number;
};

/** 封装 WorkEditForm 的单文件上传管道：slug 校验 → 大视频/覆盖确认 → workMediaKey → uploadFileAdmin → 状态机更新 */
export function useWorkUpload(args: {
  token: string;
  slug: string;
  title: string;
  setStatusMessage: SetStatus;
}) {
  const [uploading, setUploading] = useState("");

  async function upload(
    file: File,
    kind: WorkMediaKind,
    onDone: (url: string) => void,
    options?: UploadOptions,
  ) {
    const slug = resolveUploadSlug(args.slug, args.title);
    if (!slug) {
      args.setStatusMessage("请先填写标题或 slug 后再上传", "error");
      return;
    }
    if (!confirmVideoUpload(file)) {
      return;
    }
    if (!confirmMediaOverwrite(options?.fieldLabel ?? "媒体", options?.existingUrl)) {
      return;
    }
    setUploading(file.name);
    args.setStatusMessage("正在上传…");
    try {
      const key = workMediaKey(slug, kind, file, options?.detailIndex);
      const url = await uploadFileAdmin(args.token, file, key);
      onDone(url);
      args.setStatusMessage("上传成功", "success");
    } catch (err) {
      args.setStatusMessage(formatUploadFailure(err), "error");
    } finally {
      setUploading("");
    }
  }

  return { upload, uploading };
}

/** 一个 ref + state 的 blob URL 槽位，组件卸载时自动 revoke。 */
export function useBlobPreview() {
  const ref = useRef<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  function set(next: string | null) {
    if (ref.current) {
      URL.revokeObjectURL(ref.current);
    }
    ref.current = next;
    setUrl(next);
  }

  useEffect(() => {
    return () => {
      if (ref.current) {
        URL.revokeObjectURL(ref.current);
        ref.current = null;
      }
    };
  }, []);

  return [url, set] as const;
}
