"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem, WorkCategory } from "@/features/portfolio/types";
import AdminThumb from "@/components/admin/AdminThumb";
import SortableList from "@/components/admin/SortableList";
import MediaVariantImage from "@/components/MediaVariantImage";
import {
  fetchCategoriesAdmin,
  fetchWorksAdmin,
  fetchWorkStatusAdmin,
  getStoredAdminToken,
  saveWorkItemAdmin,
  slugify,
} from "@/lib/admin/api";
import {
  emptyWork,
  useBlobPreview,
  useWorkUpload,
  type StatusTone,
} from "./WorkEditForm/use-work-upload";

type WorkEditFormProps = {
  locale: string;
  slugParam: string;
  initialType?: WorkCategory;
};

/** 去掉用户粘贴路径首尾的引号 */
function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * 视频状态徽章 + CLI 命令复制按钮。
 * 挂载时自动从 COS 拉取实时状态,不依赖本地快照。
 */
function VideoStatusBlock({
  slug,
  mediaUrl: initialMediaUrl,
  mediaUrlOriginal: initialOriginal,
  token,
  refreshKey,
}: {
  slug: string;
  mediaUrl: string;
  mediaUrlOriginal?: string;
  token: string;
  refreshKey?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [localPath, setLocalPath] = useState("");
  const [realStatus, setRealStatus] = useState<"dual" | "raw-only" | "none" | null>(null);
  const [checking, setChecking] = useState(false);

  // 挂载时 + refreshKey 变化时拉实时状态
  useEffect(() => {
    if (!slug || !token) return;
    fetchWorkStatusAdmin(token, slug)
      .then((r) => setRealStatus(r.status))
      .catch(() => {});
  }, [token, slug, refreshKey]);

  const mediaUrl = realStatus === "dual" ? "has" : realStatus === "raw-only" ? "" : initialMediaUrl;
  const mediaUrlOriginal = realStatus === "raw-only" ? "has" : realStatus === "none" ? "" : initialOriginal;

  if (!mediaUrl && !mediaUrlOriginal) {
    return (
      <p className="admin-status">
        请上传原片视频文件,会落到 works/videos/{slug}.original.{"{ext}"};
        上传完成后请在终端运行 CLI 生成 1080p 低档,前台才会播放。
      </p>
    );
  }

  const cleanPath = stripQuotes(localPath);
  const cliCmd = cleanPath
    ? `npm run process:video -- ${slug} --local "${cleanPath}"`
    : "";
  const isRawOnly = !mediaUrl && !!mediaUrlOriginal;
  const isDual = !!mediaUrl;

  async function copy() {
    if (!cliCmd) return;
    try {
      await navigator.clipboard.writeText(cliCmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 忽略
    }
  }

  async function refreshStatus() {
    if (!slug || !token) return;
    setChecking(true);
    try {
      const r = await fetchWorkStatusAdmin(token, slug);
      setRealStatus(r.status);
    } catch {
      // 忽略
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className={`admin-status ${
        isRawOnly ? "admin-status--error" : isDual ? "admin-status--success" : ""
      }`}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <strong>
        {isRawOnly ? "⚠️ 未处理(raw-only) — 前台无法播放" : null}
        {isDual ? "✅ 已上线(dual) — 前台默认播 1080p,可切原画质" : null}
      </strong>
      {isRawOnly ? (
        <span style={{ fontSize: 12, opacity: 0.85 }}>
          请在项目根目录终端运行下面命令,完成后保存并重新加载本页查看绿色徽章:
        </span>
      ) : null}
      {isDual ? (
        <span style={{ fontSize: 12, opacity: 0.85 }}>
          需要重新生成低档(例如换了原片)?重跑命令即可覆盖:
        </span>
      ) : null}
      <input
        className="admin-process-local-input"
        type="text"
        placeholder="粘贴本地原片绝对路径（必填）"
        value={localPath}
        onChange={(e) => setLocalPath(e.target.value)}
        style={{ marginTop: 4 }}
      />
      <code
        style={{
          padding: "6px 10px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: 4,
          fontSize: 12,
          userSelect: "all",
        }}
      >
        {cliCmd || `npm run process:video -- ${slug} --local "填写上方路径"`}
      </code>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={copy}
          className="btn"
          disabled={!cliCmd}
          style={{ padding: "4px 12px", fontSize: 12 }}
        >
          {copied ? "已复制" : "复制命令"}
        </button>
        <button
          type="button"
          onClick={refreshStatus}
          className={`btn${isDual ? " admin-process-status-btn--ok" : ""}`}
          disabled={checking}
          style={{ padding: "4px 12px", fontSize: 12 }}
        >
          {checking ? "检查中…" : isDual ? "✓ 已就绪（dual）" : "刷新状态"}
        </button>
      </div>
    </div>
  );
}

export default function WorkEditForm({
  locale,
  slugParam,
  initialType = "video",
}: WorkEditFormProps) {
  const router = useRouter();
  const [isNew, setIsNew] = useState(slugParam === "new");
  const [token] = useState(() => getStoredAdminToken());
  const [allWorks, setAllWorks] = useState<WorkItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [work, setWork] = useState<WorkItem>(() => emptyWork(initialType));
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);
  const [coverPreviewBlob, setCoverBlob] = useBlobPreview();
  const [mediaPreviewBlob, setMediaBlob] = useBlobPreview();
  const [loadedVideoUrl, setLoadedVideoUrl] = useState<string | null>(null);

  function setStatusMessage(message: string, tone: StatusTone = "info") {
    setStatus(message);
    setStatusTone(tone);
  }

  const { upload: handleUpload, uploading, uploadProgress } = useWorkUpload({
    token,
    slug: work.slug,
    title: work.title,
    setStatusMessage,
  });

  const isVideoWork = work.category === "video";
  const isArticleWork = work.category === "article";

  useEffect(() => {
    if (!token) {
      router.replace(`/${locale}/admin`);
      return;
    }
    const loadingNew = slugParam === "new";
    Promise.all([fetchWorksAdmin(token), fetchCategoriesAdmin(token)])
      .then(([list, cats]) => {
        setAllWorks(list);
        setCategories(cats);
        if (loadingNew) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router, slugParam, token, initialType]);

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
      mediaUrlOriginal:
        work.category === "video" ? work.mediaUrlOriginal || undefined : undefined,
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
        previousSlug: isNew ? undefined : (slugParam === "new" ? slug : slugParam),
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

  /** 视频原片上传后自动保存到 COS，让内页 VideoStatusBlock 立刻能拉到真实状态 */
  async function autoSaveAfterVideoUpload(originalUrl: string) {
    const slug = work.slug.trim() || slugify(work.title);
    if (!slug) return;

    const item: WorkItem = {
      ...work,
      slug,
      mediaUrlOriginal: originalUrl,
      mediaUrl: "",
      detailImages: work.detailImages?.filter(Boolean) ?? [],
      subcategory: work.category === "video" ? work.subcategory?.trim() || categories[0] : undefined,
      duration: work.category === "video" ? work.duration : undefined,
      featured: work.featured ?? false,
      featuredLayout: work.featured ? work.featuredLayout ?? "large" : undefined,
    };

    setAutoSaving(true);
    try {
      await saveWorkItemAdmin(token, item, {
        isNew,
        previousSlug: isNew ? undefined : slugParam,
      });
      // 把真正的 slug 写回 work，让 VideoStatusBlock 能生成正确命令
      setWork((prev) => ({ ...prev, slug }));
      setIsNew(false);
      setStatusRefreshKey((k) => k + 1);
      setStatusMessage("原片已上传并自动保存，请在下方粘贴路径复制命令", "success");
    } catch {
      setStatusMessage("自动保存失败，请手动点击保存", "error");
    } finally {
      setAutoSaving(false);
    }
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
      {uploading ? (
        <div className="admin-upload-progress">
          <p className="admin-status">正在上传：{uploading}</p>
          {uploadProgress > 0 ? (
            <div className="admin-progress-bar">
              <div
                className="admin-progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
              <span className="admin-progress-bar-text">{uploadProgress}%</span>
            </div>
          ) : (
            <p className="admin-status" style={{ fontSize: "12px", opacity: 0.7 }}>
              准备中…
            </p>
          )}
        </div>
      ) : null}

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
          {isVideoWork ? (
            <VideoStatusBlock
              slug={work.slug || slugParam}
              mediaUrl={work.mediaUrl}
              mediaUrlOriginal={work.mediaUrlOriginal}
              token={token}
              refreshKey={statusRefreshKey}
            />
          ) : null}
          {mediaPreviewBlob || work.mediaUrl || (isVideoWork && work.mediaUrlOriginal) ? (
            isVideoWork ? (
              mediaPreviewBlob ||
              loadedVideoUrl === (work.mediaUrl || work.mediaUrlOriginal || "") ? (
                <video
                  className="admin-preview-video"
                  src={
                    mediaPreviewBlob ?? (work.mediaUrl || work.mediaUrlOriginal || "")
                  }
                  controls
                  preload="none"
                />
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setLoadedVideoUrl(work.mediaUrl || work.mediaUrlOriginal || "")
                  }
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
                if (isVideoWork) {
                  // 视频上传:落到 .original.{ext}, 设置 mediaUrlOriginal,清空 mediaUrl(待 CLI 处理)
                  void handleUpload(
                    f,
                    "video-original",
                    (url) => {
                      setMediaBlob(null);
                      setLoadedVideoUrl(null);
                      setWork((prev) => ({
                        ...prev,
                        mediaUrlOriginal: url,
                        mediaUrl: "",
                      }));
                      // 上传完成后自动保存到 COS，让 VideoStatusBlock 立即可用
                      void autoSaveAfterVideoUpload(url);
                    },
                    {
                      existingUrl: work.mediaUrlOriginal,
                      fieldLabel: "原片",
                    },
                  );
                } else {
                  // 摄影主图:走原 gallery 路径,直接填 mediaUrl
                  void handleUpload(
                    f,
                    "gallery",
                    (url) => {
                      setMediaBlob(null);
                      setLoadedVideoUrl(null);
                      updateField("mediaUrl", url);
                    },
                    { existingUrl: work.mediaUrl, fieldLabel: "主图" },
                  );
                }
              }
            }}
          />
        </section>
      ) : null}

      {!isArticleWork ? (
        <section className="admin-upload-section">
          <h2>详情页素材（图片/MP4，可多个，拖拽排序）</h2>
          {(work.detailImages ?? []).length > 0 ? (
            <SortableList
              items={work.detailImages ?? []}
              getItemId={(url, index) => `${url}__${index}`}
              onReorder={(urls) => updateField("detailImages", urls)}
              className="admin-gallery-edit"
              itemClassName="admin-gallery-edit-row admin-sortable-row"
              renderItem={(url, index, dragHandle) => (
                <>
                  {dragHandle}
                  {/\.(mp4|webm|mov)(\?|$)/i.test(url) ? (
                    <video
                      src={url}
                      muted
                      className="admin-gallery-edit-thumb"
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                    />
                  ) : (
                    <AdminThumb src={url} size={48} className="admin-gallery-edit-thumb" />
                  )}
                  <span className="admin-gallery-edit-label">详情素材 {index + 1}</span>
                  <button type="button" onClick={() => removeDetailImage(index)}>
                    删除
                  </button>
                </>
              )}
            />
          ) : null}
          <input
            type="file"
            accept="image/*,video/mp4"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const baseIndex = (work.detailImages ?? []).length;
              let offset = 0;
              for (const f of files) {
                if (f.type === "video/mp4" || f.name.toLowerCase().endsWith(".mp4")) {
                  const mb = f.size / 1024 / 1024;
                  if (mb > 50) {
                    alert(`详情视频 ${f.name} 超过 50MB（${mb.toFixed(1)}MB），请压缩后再上传`);
                    continue;
                  }
                }
                const idx = baseIndex + offset;
                offset++;
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
                    detailIndex: idx,
                    fieldLabel: "详情素材",
                  },
                );
              }
            }}
          />
        </section>
      ) : null}

      <div className="admin-form-actions">
        <button type="submit" className="btn" disabled={saving || autoSaving || !!uploading}>
          {saving ? "保存中…" : autoSaving ? "自动保存中…" : "保存全部作品"}
        </button>
      </div>

    </form>
  );
}
