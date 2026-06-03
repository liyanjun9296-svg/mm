"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem, WorkCategory } from "@/features/portfolio/types";
import AdminThumb from "@/components/admin/AdminThumb";
import SortableList from "@/components/admin/SortableList";
import MediaVariantImage from "@/components/MediaVariantImage";
import {
  confirmMediaOverwrite,
  confirmVideoUpload,
  fetchCategoriesAdmin,
  fetchWorksAdmin,
  formatUploadFailure,
  getStoredAdminToken,
  resolveUploadSlug,
  saveWorkItemAdmin,
  slugify,
  uploadFileAdmin,
  workMediaKey,
  type WorkMediaKind,
} from "@/lib/admin/api";

const emptyWork = (category: WorkCategory): WorkItem => ({
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  category,
  subcategory: category === "video" ? "产品" : undefined,
  duration: "",
  coverImage: "",
  mediaUrl: "",
  role: "",
  year: new Date().getFullYear().toString(),
  platform: "",
  externalUrl: "",
  detailImages: [],
  featured: false,
});

type WorkEditFormProps = {
  locale: string;
  slugParam: string;
  initialType?: WorkCategory;
};

export default function WorkEditForm({
  locale,
  slugParam,
  initialType = "video",
}: WorkEditFormProps) {
  const router = useRouter();
  const isNew = slugParam === "new";
  const [token] = useState(() => getStoredAdminToken());
  const [allWorks, setAllWorks] = useState<WorkItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [work, setWork] = useState<WorkItem>(() => emptyWork(initialType));
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);
  const [coverPreviewBlob, setCoverPreviewBlob] = useState<string | null>(null);
  const [mediaPreviewBlob, setMediaPreviewBlob] = useState<string | null>(null);
  const [loadedVideoUrl, setLoadedVideoUrl] = useState<string | null>(null);
  const coverPreviewBlobRef = useRef<string | null>(null);
  const mediaPreviewBlobRef = useRef<string | null>(null);

  function revokeBlobUrl(url: string | null) {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  function setCoverBlob(url: string | null) {
    revokeBlobUrl(coverPreviewBlobRef.current);
    coverPreviewBlobRef.current = url;
    setCoverPreviewBlob(url);
  }

  function setMediaBlob(url: string | null) {
    revokeBlobUrl(mediaPreviewBlobRef.current);
    mediaPreviewBlobRef.current = url;
    setMediaPreviewBlob(url);
  }

  useEffect(() => {
    return () => {
      revokeBlobUrl(coverPreviewBlobRef.current);
      revokeBlobUrl(mediaPreviewBlobRef.current);
    };
  }, []);

  function setStatusMessage(message: string, tone: "info" | "success" | "error" = "info") {
    setStatus(message);
    setStatusTone(tone);
  }

  const isVideoWork = work.category === "video";
  const isArticleWork = work.category === "article";

  useEffect(() => {
    if (!token) {
      router.replace(`/${locale}/admin`);
      return;
    }
    Promise.all([fetchWorksAdmin(token), fetchCategoriesAdmin(token)])
      .then(([list, cats]) => {
        setAllWorks(list);
        setCategories(cats);
        if (isNew) {
          setWork(emptyWork(initialType));
        } else {
          const found = list.find((w) => w.slug === slugParam);
          if (found) {
            setWork({ ...found, detailImages: found.detailImages ?? [] });
          } else {
            setStatusMessage("未找到该作品", "error");
          }
        }
      })
      .catch((err) => {
        setStatusMessage(err instanceof Error ? err.message : "加载失败", "error");
      });
  }, [locale, router, slugParam, isNew, token, initialType]);

  function updateField<K extends keyof WorkItem>(key: K, value: WorkItem[K]) {
    setWork((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category" && value === "photo") {
        next.subcategory = undefined;
        next.duration = "";
      }
      if (key === "category" && value === "article") {
        next.subcategory = undefined;
        next.duration = "";
      }
      if (key === "category" && value === "video" && !next.subcategory) {
        next.subcategory = categories[0] ?? "产品";
      }
      return next;
    });
  }

  async function handleUpload(
    file: File,
    kind: WorkMediaKind,
    onDone: (url: string) => void,
    options?: { existingUrl?: string; fieldLabel?: string; detailIndex?: number },
  ) {
    const slug = resolveUploadSlug(work.slug, work.title);
    if (!slug) {
      setStatusMessage("请先填写标题或 slug 后再上传", "error");
      return;
    }
    if (!confirmVideoUpload(file)) {
      return;
    }
    if (!confirmMediaOverwrite(options?.fieldLabel ?? "媒体", options?.existingUrl)) {
      return;
    }
    setUploading(file.name);
    setStatusMessage("正在上传…");
    try {
      const key = workMediaKey(slug, kind, file, options?.detailIndex);
      const url = await uploadFileAdmin(token, file, key);
      onDone(url);
      setStatusMessage("上传成功", "success");
    } catch (err) {
      setStatusMessage(formatUploadFailure(err), "error");
    } finally {
      setUploading("");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const slug = work.slug.trim() || slugify(work.title);
    if (!slug) {
      setStatusMessage("请填写标题以生成 slug，或手动填写 slug", "error");
      return;
    }

    const item: WorkItem = {
      ...work,
      slug,
      detailImages: work.detailImages?.filter(Boolean) ?? [],
      subcategory: work.category === "video" ? work.subcategory?.trim() || categories[0] : undefined,
      duration: work.category === "video" ? work.duration : undefined,
      featured: work.featured ?? false,
      featuredLayout: work.featured ? work.featuredLayout ?? "large" : undefined,
      mediaUrl:
        work.category === "article" && !work.mediaUrl
          ? work.coverImage
          : work.mediaUrl,
    };

    if (isNew && allWorks.some((w) => w.slug === slug)) {
      setStatusMessage("slug 已存在，请换一个", "error");
      return;
    }

    setSaving(true);
    setStatusMessage("正在保存到云端…");
    try {
      await saveWorkItemAdmin(token, item, {
        isNew,
        previousSlug: isNew ? undefined : slugParam,
      });
      setStatusMessage("已保存到云端", "success");
      router.push(`/${locale}/admin/works`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  }

  function removeDetailImage(index: number) {
    const imgs = [...(work.detailImages ?? [])];
    imgs.splice(index, 1);
    updateField("detailImages", imgs);
  }

  const pageTitle = isNew
    ? initialType === "photo"
      ? "新建摄影"
      : initialType === "article"
        ? "新建文章"
        : "新建视频"
    : work.category === "photo"
      ? "编辑摄影"
      : work.category === "article"
        ? "编辑文章"
        : "编辑视频";

  return (
    <form className="admin-panel admin-edit" onSubmit={handleSave}>
      <div className="admin-toolbar">
        <h1 className="admin-title">{pageTitle}</h1>
        <Link href={`/${locale}/admin/works`} className="work-link">
          返回列表
        </Link>
      </div>
      {status ? (
        <p
          className={`admin-status${
            statusTone === "error"
              ? " admin-status--error"
              : statusTone === "success"
                ? " admin-status--success"
                : ""
          }`}
        >
          {status}
        </p>
      ) : null}
      {uploading ? <p className="admin-status">正在上传：{uploading}</p> : null}

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>标题 *</span>
          <input
            value={work.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Slug（URL 标识）</span>
          <input
            value={work.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder={slugify(work.title) || "留空则根据标题自动生成（中文会生成 work-时间戳）"}
          />
        </label>
        <label className="admin-field">
          <span>副标题</span>
          <input
            value={work.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
          />
        </label>
        <label className="admin-field admin-field-full">
          <span>简介</span>
          <textarea
            value={work.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
          />
        </label>
        {!isNew ? (
          <label className="admin-field">
            <span>类型</span>
            <select
              value={work.category}
              onChange={(e) => updateField("category", e.target.value as WorkCategory)}
            >
              <option value="video">视频</option>
              <option value="photo">摄影</option>
              <option value="article">文章</option>
            </select>
          </label>
        ) : null}
        <label className="admin-field admin-field-full">
          <span>
            <input
              type="checkbox"
              checked={work.featured ?? false}
              onChange={(e) => updateField("featured", e.target.checked)}
            />{" "}
            首页精品展示
          </span>
        </label>
        {work.featured ? (
          <label className="admin-field">
            <span>精品卡片尺寸</span>
            <select
              value={work.featuredLayout ?? "large"}
              onChange={(e) =>
                updateField("featuredLayout", e.target.value as "large" | "compact")
              }
            >
              <option value="large">大卡（首行 2 个）</option>
              <option value="compact">小卡（次行 4 个）</option>
            </select>
          </label>
        ) : null}
        {isVideoWork ? (
          <>
            <label className="admin-field">
              <span>视频分类</span>
              <input
                list="admin-video-categories"
                value={work.subcategory ?? ""}
                onChange={(e) => updateField("subcategory", e.target.value)}
                placeholder="选择或输入新分类"
              />
              <datalist id="admin-video-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="admin-field">
              <span>时长</span>
              <input
                value={work.duration ?? ""}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="例：3:24"
              />
            </label>
          </>
        ) : null}
        <label className="admin-field">
          <span>角色</span>
          <input value={work.role} onChange={(e) => updateField("role", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>年份</span>
          <input value={work.year} onChange={(e) => updateField("year", e.target.value)} />
        </label>
        <label className="admin-field">
          <span>平台</span>
          <input
            value={work.platform}
            onChange={(e) => updateField("platform", e.target.value)}
          />
        </label>
        <label className="admin-field admin-field-full">
          <span>外链</span>
          <input
            value={work.externalUrl ?? ""}
            onChange={(e) => updateField("externalUrl", e.target.value)}
          />
        </label>
      </div>

      <section className="admin-upload-section">
        <h2>{isVideoWork ? "封面（建议 16:9）" : isArticleWork ? "文章封面" : "列表封面"}</h2>
        {coverPreviewBlob || work.coverImage ? (
          <div className="admin-preview admin-preview-cover">
            {coverPreviewBlob ? (
              <Image src={coverPreviewBlob} alt="" width={320} height={180} unoptimized />
            ) : (
              <MediaVariantImage
                src={work.coverImage}
                variant="list"
                alt=""
                width={320}
                height={180}
              />
            )}
          </div>
        ) : null}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setCoverBlob(URL.createObjectURL(f));
              void handleUpload(f, "cover", (url) => {
                setCoverBlob(null);
                updateField("coverImage", url);
              }, { existingUrl: work.coverImage, fieldLabel: "封面" });
            }
          }}
        />
      </section>

      {!isArticleWork ? (
        <section className="admin-upload-section">
          <h2>{isVideoWork ? "主视频" : "主图（详情页大图）"}</h2>
          {mediaPreviewBlob || work.mediaUrl ? (
            isVideoWork ? (
              mediaPreviewBlob || loadedVideoUrl === work.mediaUrl ? (
                <video
                  className="admin-preview-video"
                  src={mediaPreviewBlob ?? work.mediaUrl}
                  controls
                  preload="none"
                />
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setLoadedVideoUrl(work.mediaUrl)}
                >
                  点击加载视频预览（避免自动消耗 COS 流量）
                </button>
              )
            ) : (
              <div className="admin-preview admin-preview-cover">
                {mediaPreviewBlob ? (
                  <Image
                    src={mediaPreviewBlob}
                    alt=""
                    width={320}
                    height={320}
                    unoptimized
                  />
                ) : (
                  <MediaVariantImage
                    src={work.mediaUrl}
                    variant="detail"
                    alt=""
                    width={320}
                    height={320}
                  />
                )}
              </div>
            )
          ) : null}
          <input
            type="file"
            accept={isVideoWork ? "video/*" : "image/*"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const blobUrl = URL.createObjectURL(f);
                setMediaBlob(blobUrl);
                const kind = isVideoWork ? "video" : "gallery";
                void handleUpload(
                  f,
                  kind,
                  (url) => {
                    setMediaBlob(null);
                    setLoadedVideoUrl(null);
                    updateField("mediaUrl", url);
                  },
                  { existingUrl: work.mediaUrl, fieldLabel: isVideoWork ? "主视频" : "主图" },
                );
              }
            }}
          />
        </section>
      ) : null}

      {!isArticleWork ? (
        <section className="admin-upload-section">
          <h2>详情页图片（可多张，拖拽排序）</h2>
          {(work.detailImages ?? []).length > 0 ? (
            <SortableList
              items={work.detailImages ?? []}
              getItemId={(url) => url}
              onReorder={(urls) => updateField("detailImages", urls)}
              className="admin-gallery-edit"
              itemClassName="admin-gallery-edit-row admin-sortable-row"
              renderItem={(url, index, dragHandle) => (
                <>
                  {dragHandle}
                  <AdminThumb src={url} size={48} className="admin-gallery-edit-thumb" />
                  <span className="admin-gallery-edit-label">详情图 {index + 1}</span>
                  <button type="button" onClick={() => removeDetailImage(index)}>
                    删除
                  </button>
                </>
              )}
            />
          ) : null}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              files.forEach((f) => {
                void handleUpload(
                  f,
                  "gallery-detail",
                  (url) => {
                    setWork((prev) => ({
                      ...prev,
                      detailImages: [...(prev.detailImages ?? []), url],
                    }));
                  },
                  {
                    detailIndex: (work.detailImages ?? []).length,
                    fieldLabel: "详情图",
                  },
                );
              });
            }}
          />
        </section>
      ) : null}

      <div className="admin-form-actions">
        <button type="submit" className="btn" disabled={saving || !!uploading}>
          {saving ? "保存中…" : "保存全部作品"}
        </button>
      </div>
    </form>
  );
}
