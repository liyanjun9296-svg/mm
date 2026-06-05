"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { VariantWarning } from "@/lib/admin/upload-image-variants";

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

const WAIT_FOR_IDLE_TIMEOUT_MS = 60_000;
const WAIT_FOR_IDLE_POLL_MS = 50;

/** 封装 WorkEditForm 的单文件上传管道：slug 校验 → 大视频/覆盖确认 → workMediaKey → uploadFileAdmin → 状态机更新 */
export function useWorkUpload(args: {
  token: string;
  slug: string;
  title: string;
  setStatusMessage: SetStatus;
}) {
  const [uploading, setUploading] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  // 并发上传计数：state 用于触发 UI（保存按钮禁用），ref 用于 waitForIdle 同步轮询
  const [activeCount, setActiveCount] = useState(0);
  const activeCountRef = useRef(0);

  function bumpActive(delta: number) {
    activeCountRef.current = Math.max(0, activeCountRef.current + delta);
    setActiveCount(activeCountRef.current);
  }

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
    bumpActive(1);
    setUploading(file.name);
    setUploadProgress(0);
    args.setStatusMessage("正在上传…");
    const variantWarnings: VariantWarning[] = [];
    try {
      const key = workMediaKey(slug, kind, file, options?.detailIndex);
      const url = await uploadFileAdmin(
        args.token,
        file,
        key,
        (percent) => {
          setUploadProgress(percent);
        },
        (warning) => {
          variantWarnings.push(warning);
        },
      );
      onDone(url);
      if (variantWarnings.length > 0) {
        const failed = variantWarnings.map((w) => w.variant).join(" / ");
        args.setStatusMessage(
          `上传成功（${failed} 缩略档失败，原图可用；可稍后跑 npm run cos:migrate-images -- --apply 补齐）`,
          "info",
        );
      } else if (kind === "video-original") {
        args.setStatusMessage(
          `原片上传成功 — 自动保存中，完成后可在下方粘贴路径并复制 CLI 命令`,
          "success",
        );
      } else {
        args.setStatusMessage("上传成功", "success");
      }
    } catch (err) {
      args.setStatusMessage(formatUploadFailure(err), "error");
    } finally {
      bumpActive(-1);
      // 仅当没有其他并发上传在跑时清空进度条
      if (activeCountRef.current === 0) {
        setUploading("");
        setUploadProgress(0);
      }
    }
  }

  /**
   * 轮询等待所有并发上传结束。用于 autoSave 之前避免读到陈旧 state。
   * 超时仍 resolve（防止永久挂起），由调用方决定是否继续。
   */
  const waitForIdle = useCallback(async () => {
    if (activeCountRef.current === 0) return;
    const start = Date.now();
    while (activeCountRef.current > 0) {
      if (Date.now() - start > WAIT_FOR_IDLE_TIMEOUT_MS) {
        console.warn("[useWorkUpload] waitForIdle 超时，仍有上传未完成");
        return;
      }
      await new Promise((r) => setTimeout(r, WAIT_FOR_IDLE_POLL_MS));
    }
    // 让 React 把最后一次 setState 提交完
    await new Promise((r) => setTimeout(r, 0));
  }, []);

  return {
    upload,
    uploading,
    uploadProgress,
    isUploading: activeCount > 0,
    waitForIdle,
  };
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
