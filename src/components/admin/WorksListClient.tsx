"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem } from "@/features/portfolio/types";
import VideoCategoryManager from "@/components/admin/VideoCategoryManager";
import {
  clearStoredAdminToken,
  deleteWorkItemAdmin,
  fetchWorksAdmin,
  getStoredAdminToken,
} from "@/lib/admin/api";

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

  function handleLogout() {
    clearStoredAdminToken();
    router.push(`/${locale}/admin`);
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
      <ul className="admin-works-list">
        {filteredWorks.map((work) => (
          <li key={work.slug} className="admin-works-item">
            <div>
              <strong>{work.title}</strong>
              <span className="admin-works-meta">
                {work.category === "video"
                  ? "视频"
                  : work.category === "photo"
                    ? "摄影"
                    : "文章"}
                {work.subcategory ? ` · ${work.subcategory}` : ""} · {work.slug}
              </span>
            </div>
            <div className="admin-works-actions">
              <Link href={`/${locale}/admin/works/${work.slug}`} className="work-link">
                编辑
              </Link>
              <button type="button" className="work-link" onClick={() => openDeleteDialog(work)}>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
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
