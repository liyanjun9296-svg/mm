"use client";

import AdminThumb from "@/components/admin/AdminThumb";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem } from "@/features/portfolio/types";
import VideoCategoryManager from "@/components/admin/VideoCategoryManager";
import SortableList from "@/components/admin/SortableList";
import {
  clearStoredAdminToken,
  deleteWorkItemAdmin,
  fetchWorksAdmin,
  fetchWorkStatusAdmin,
  getStoredAdminToken,
  pullFromCosAdmin,
  saveWorksAdmin,
} from "@/lib/admin/api";
import { reorderPhotosInWorks, reorderVideosInWorks } from "@/lib/admin/reorder-works";

/** 去掉用户粘贴路径首尾的引号 */
function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * 视频状态圆点：绿=dual, 红=raw-only/none
 * 点击弹出浮层：复制 process:video 命令 + 刷新状态
 */
function VideoStatusDot({ work, token }: { work: WorkItem; token: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusOverride, setStatusOverride] = useState<"dual" | "raw-only" | "none" | null>(null);
  const [localPath, setLocalPath] = useState("");

  // 挂载时自动拉取实时状态
  useEffect(() => {
    fetchWorkStatusAdmin(token, work.slug)
      .then((r) => setStatusOverride(r.status))
      .catch(() => {});
  }, [token, work.slug]);

  const currentStatus = statusOverride ?? (work.mediaUrl ? "dual" : work.mediaUrlOriginal ? "raw-only" : "none");
  const isDual = currentStatus === "dual";
  const cleanPath = stripQuotes(localPath);
  const cliCmd = cleanPath
    ? `npm run process:video -- ${work.slug} --local "${cleanPath}"`
    : "";

  async function copy() {
    if (!cliCmd) return;
    try {
      await navigator.clipboard.writeText(cliCmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function refreshStatus() {
    setChecking(true);
    try {
      const result = await fetchWorkStatusAdmin(token, work.slug);
      setStatusOverride(result.status);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }

  return (
    <span className="admin-video-status-wrap" style={{ position: "relative" }}>
      <button
        type="button"
        className={`admin-video-dot${isDual ? " admin-video-dot--ok" : " admin-video-dot--pending"}`}
        title={isDual ? "已就绪（dual）" : "待处理"}
        onClick={() => setOpen(!open)}
      />
      {open ? (
        <div className="admin-video-popover" onClick={(e) => e.stopPropagation()}>
          <input
            className="admin-process-local-input"
            type="text"
            placeholder="粘贴本地路径（必填）"
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
          />
          <code className="admin-video-popover-cmd">{cliCmd || `npm run process:video -- ${work.slug} --local "填写上方路径"`}</code>
          <div className="admin-video-popover-actions">
            <button type="button" className="btn" onClick={copy} disabled={!cliCmd}>
              {copied ? "已复制" : "复制"}
            </button>
            <button
              type="button"
              className={`btn${isDual ? " admin-process-status-btn--ok" : ""}`}
              onClick={refreshStatus}
              disabled={checking}
            >
              {checking ? "…" : isDual ? "✓" : "刷新"}
            </button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
}

type WorksListClientProps = {
  locale: string;
};

type ListTab = "全部" | "视频" | "摄影" | "文章";

type PendingDelete = {
  slug: string;
  title: string;
};

export default function WorksListClient({ locale }: WorksListClientProps) {
  const router = useRouter();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [status, setStatus] = useState("加载中…");
  const [token] = useState(() => getStoredAdminToken());
  const [activeTab, setActiveTab] = useState<ListTab>("全部");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteMediaFromCos, setDeleteMediaFromCos] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!token) {
      router.replace(`/${locale}/admin`);
      return;
    }
    fetchWorksAdmin(token)
      .then((data) => {
        setWorks(data);
        setStatus("");
      })
      .catch((err) => {
        setStatus(err instanceof Error ? err.message : "加载失败");
      });
  }, [locale, router, token]);

  const filteredWorks = useMemo(() => {
    if (activeTab === "视频") {
      return works.filter((w) => w.category === "video");
    }
    if (activeTab === "摄影") {
      return works.filter((w) => w.category === "photo");
    }
    if (activeTab === "文章") {
      return works.filter((w) => w.category === "article");
    }
    return works;
  }, [works, activeTab]);


  function openDeleteDialog(work: WorkItem) {
    setDeleteMediaFromCos(false);
    setPendingDelete({ slug: work.slug, title: work.title });
  }

  function closeDeleteDialog() {
    if (deleting) {
      return;
    }
    setPendingDelete(null);
    setDeleteMediaFromCos(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const { slug } = pendingDelete;
    setDeleting(true);
    try {
      const result = await deleteWorkItemAdmin(token, slug, {
        deleteMedia: deleteMediaFromCos,
      });
      setWorks((prev) => prev.filter((w) => w.slug !== slug));
      if (deleteMediaFromCos) {
        const count = result.mediaDeleted.length;
        setStatus(
          count > 0
            ? `已删除作品及 ${count} 个 COS 媒体文件`
            : "已删除作品记录（无本 Bucket 媒体可删，或文件被其它作品引用）",
        );
      } else {
        setStatus("已删除作品记录（COS 媒体文件仍保留）");
      }
      setPendingDelete(null);
      setDeleteMediaFromCos(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  async function saveReorderedWorks(nextWorks: WorkItem[]) {
    const previousWorks = works;
    setWorks(nextWorks);
    setReordering(true);
    setStatus("正在保存排序…");
    try {
      await saveWorksAdmin(token, nextWorks);
      setStatus("排序已保存");
    } catch (err) {
      setWorks(previousWorks);
      setStatus(err instanceof Error ? err.message : "排序保存失败");
    } finally {
      setReordering(false);
    }
  }

  async function handleVideoReorder(newVideoOrder: WorkItem[]) {
    await saveReorderedWorks(reorderVideosInWorks(works, newVideoOrder));
  }

  async function handlePhotoReorder(newPhotoOrder: WorkItem[]) {
    await saveReorderedWorks(reorderPhotosInWorks(works, newPhotoOrder));
  }

  function handleLogout() {
    clearStoredAdminToken();
    router.push(`/${locale}/admin`);
  }

  function renderWorkThumb(work: WorkItem) {
    return <AdminThumb src={work.coverImage || work.mediaUrl} size={40} />;
  }

  function renderWorkRow(work: WorkItem, dragHandle?: ReactNode) {
    return (
      <>
        <div className="admin-works-item-main">
          {dragHandle}
          {renderWorkThumb(work)}
          {work.category === "video" ? (
            <VideoStatusDot work={work} token={token} />
          ) : null}
          <div>
            <div className="admin-works-title-row">
              <strong>{work.title}</strong>
            </div>
            <span className="admin-works-meta">
              {work.category === "video"
                ? "视频"
                : work.category === "photo"
                  ? "摄影"
                  : "文章"}
              {work.subcategory ? ` · ${work.subcategory}` : ""} · {work.slug}
            </span>
          </div>
        </div>
        <div className="admin-works-actions">
          <Link href={`/${locale}/admin/works/${work.slug}`} className="work-link">
            编辑
          </Link>
          <button type="button" className="work-link" onClick={() => openDeleteDialog(work)}>
            删除
          </button>
        </div>
      </>
    );
  }

  async function handlePullFromCos() {
    if (pulling) {
      return;
    }
    setPulling(true);
    setStatus("正在从 COS 拉取最新…");
    try {
      const result = await pullFromCosAdmin(token);
      const data = await fetchWorksAdmin(token);
      setWorks(data);
      const failedNote =
        result.mediaFailed.length > 0
          ? `，${result.mediaFailed.length} 个媒体下载失败`
          : "";
      setStatus(
        `已同步 ${result.worksCount} 条作品 · 新增媒体 ${result.mediaDownloaded} 个（已存在 ${result.mediaSkipped}）${failedNote}`,
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "拉取失败");
    } finally {
      setPulling(false);
    }
  }

  const tabs: ListTab[] = ["全部", "视频", "摄影", "文章"];

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <h1 className="admin-title">作品列表</h1>
        <div className="admin-toolbar-actions">
          <Link href={`/${locale}/admin/works/new?type=video`} className="btn">
            新建视频
          </Link>
          <Link href={`/${locale}/admin/works/new?type=photo`} className="btn">
            新建摄影
          </Link>
          <Link href={`/${locale}/admin/works/batch-photos`} className="btn">
            批量上传摄影
          </Link>
          <Link href={`/${locale}/admin/works/new?type=article`} className="btn">
            新建文章
          </Link>
          {isDev ? (
            <button
              type="button"
              className="btn"
              onClick={handlePullFromCos}
              disabled={pulling}
              title="从 COS 拉取最新作品和媒体到本地 .dev-data/（用于多人协作同步）"
            >
              {pulling ? "拉取中…" : "从 COS 拉取最新"}
            </button>
          ) : null}
          <button type="button" className="btn" onClick={handleLogout}>
            退出
          </button>
        </div>
      </div>

      <VideoCategoryManager />

      <div className="admin-list-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-list-tab${activeTab === tab ? " admin-list-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {status ? <p className="admin-status">{status}</p> : null}
      {(activeTab === "视频" || activeTab === "摄影") && filteredWorks.length > 0 ? (
        <>
          <p className="admin-desc admin-sort-hint">
            拖拽左侧手柄可调整前台{activeTab === "视频" ? "全部作品视频" : "摄影区"}展示顺序
            {reordering ? "（保存中…）" : ""}
          </p>
          <SortableList
            items={filteredWorks}
            getItemId={(work) => work.slug}
            onReorder={activeTab === "视频" ? handleVideoReorder : handlePhotoReorder}
            className="admin-works-list"
            itemClassName="admin-works-item admin-sortable-row"
            renderItem={(work, _index, dragHandle) => renderWorkRow(work, dragHandle)}
          />
        </>
      ) : (
        <ul className="admin-works-list">
          {filteredWorks.map((work) => (
            <li key={work.slug} className="admin-works-item">
              {renderWorkRow(work)}
            </li>
          ))}
        </ul>
      )}
      {filteredWorks.length === 0 && !status.includes("加载") ? (
        <p className="admin-desc">
          {activeTab === "摄影"
            ? "暂无摄影作品，点击「批量上传摄影」开始添加。"
            : activeTab === "视频"
              ? "暂无视频作品，点击「新建视频」开始添加。"
              : "暂无作品，点击上方按钮开始添加。"}
        </p>
      ) : null}

      {pendingDelete ? (
        <div className="admin-delete-overlay" role="presentation" onClick={closeDeleteDialog}>
          <div
            className="admin-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-delete-title" className="admin-delete-title">
              删除「{pendingDelete.title}」？
            </h2>
            <p className="admin-delete-desc">
              默认只移除作品条目，COS 里的视频/封面文件仍保留。
            </p>
            <label className="admin-delete-checkbox">
              <input
                type="checkbox"
                checked={deleteMediaFromCos}
                onChange={(e) => setDeleteMediaFromCos(e.target.checked)}
                disabled={deleting}
              />
              同时删除 COS 中的视频/封面文件（不可恢复，外链不会被删）
            </label>
            <div className="admin-delete-actions">
              <button type="button" className="btn" onClick={closeDeleteDialog} disabled={deleting}>
                取消
              </button>
              <button type="button" className="btn admin-delete-confirm" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "删除中…" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
