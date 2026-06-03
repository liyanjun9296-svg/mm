"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem } from "@/features/portfolio/types";
import SortableList from "@/components/admin/SortableList";
import {
  fetchWorksAdmin,
  formatUploadFailure,
  getStoredAdminToken,
  saveWorkItemsBatchAdmin,
  slugify,
  titleFromFilename,
  uploadFileAdmin,
  workMediaKey,
} from "@/lib/admin/api";

type PhotoBatchUploadFormProps = {
  locale: string;
};

type SharedMeta = {
  subtitle: string;
  description: string;
  role: string;
  year: string;
  platform: string;
};

type FilePreviewEntry = {
  file: File;
  previewUrl: string;
};

const defaultMeta = (): SharedMeta => ({
  subtitle: "",
  description: "",
  role: "摄影",
  year: new Date().getFullYear().toString(),
  platform: "",
});

function uniquePhotoSlug(baseTitle: string, index: number): string {
  const base = slugify(baseTitle) || "photo";
  return `${base}-${Date.now()}-${index}`;
}

function fileEntryId(entry: FilePreviewEntry): string {
  return `${entry.file.name}-${entry.file.size}-${entry.file.lastModified}`;
}

export default function PhotoBatchUploadForm({ locale }: PhotoBatchUploadFormProps) {
  const router = useRouter();
  const [token] = useState(() => getStoredAdminToken());
  const [allWorks, setAllWorks] = useState<WorkItem[]>([]);
  const [meta, setMeta] = useState<SharedMeta>(defaultMeta);
  const [fileEntries, setFileEntries] = useState<FilePreviewEntry[]>([]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const fileEntriesRef = useRef(fileEntries);

  useEffect(() => {
    fileEntriesRef.current = fileEntries;
  }, [fileEntries]);

  useEffect(() => {
    if (!token) {
      router.replace(`/${locale}/admin`);
      return;
    }
    fetchWorksAdmin(token)
      .then(setAllWorks)
      .catch((err) => {
        setStatus(err instanceof Error ? err.message : "加载失败");
      });
  }, [locale, router, token]);

  useEffect(() => {
    return () => {
      fileEntriesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, []);

  function updateMeta<K extends keyof SharedMeta>(key: K, value: SharedMeta[K]) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    fileEntriesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    const entries = picked.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setFileEntries(entries);
    setStatus(picked.length > 0 ? `已选择 ${picked.length} 张图片，可拖拽调整顺序` : "");
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fileEntries.length === 0) {
      setStatus("请先选择要上传的图片");
      return;
    }

    setSaving(true);
    const newItems: WorkItem[] = [];
    const files = fileEntries.map((entry) => entry.file);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`正在上传 ${i + 1} / ${files.length}：${file.name}`);
        const title = titleFromFilename(file.name);
        const slug = uniquePhotoSlug(title, i);
        const url = await uploadFileAdmin(
          token,
          file,
          workMediaKey(slug, "gallery", file),
        );

        newItems.push({
          slug,
          title,
          subtitle: meta.subtitle,
          description: meta.description,
          category: "photo",
          coverImage: url,
          mediaUrl: url,
          role: meta.role,
          year: meta.year,
          platform: meta.platform,
        });
      }

      const existingSlugs = new Set(allWorks.map((w) => w.slug));
      const deduped = newItems.map((item, i) =>
        existingSlugs.has(item.slug)
          ? { ...item, slug: uniquePhotoSlug(item.title, i + files.length) }
          : item,
      );

      await saveWorkItemsBatchAdmin(token, deduped);
      setStatus(`已保存 ${deduped.length} 张摄影作品`);
      router.push(`/${locale}/admin/works`);
    } catch (err) {
      setStatus(formatUploadFailure(err));
      setSaving(false);
    }
  }

  return (
    <form className="admin-panel admin-batch-photo" onSubmit={handleSubmit}>
      <div className="admin-toolbar">
        <h1 className="admin-title">批量上传摄影</h1>
        <Link href={`/${locale}/admin/works`} className="work-link">
          返回列表
        </Link>
      </div>

      <p className="admin-desc">
        选好一批图片后，只需填写一次 Vibe、详情介绍等信息，每张图会自动生成标题并出现在首页摄影区。
      </p>

      {status ? <p className="admin-status">{status}</p> : null}

      <section className="admin-upload-section">
        <h2>本批共用信息</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Vibe / 氛围（副标题）</span>
            <input
              value={meta.subtitle}
              onChange={(e) => updateMeta("subtitle", e.target.value)}
              placeholder="例：Studio Portrait、城市夜景"
            />
          </label>
          <label className="admin-field">
            <span>年份</span>
            <input
              value={meta.year}
              onChange={(e) => updateMeta("year", e.target.value)}
            />
          </label>
          <label className="admin-field admin-field-full">
            <span>详情介绍</span>
            <textarea
              value={meta.description}
              onChange={(e) => updateMeta("description", e.target.value)}
              rows={3}
              placeholder="本组摄影的统一说明，会显示在每张图的详情页"
            />
          </label>
          <label className="admin-field">
            <span>角色</span>
            <input
              value={meta.role}
              onChange={(e) => updateMeta("role", e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>平台（可选）</span>
            <input
              value={meta.platform}
              onChange={(e) => updateMeta("platform", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="admin-upload-section">
        <h2>选择图片（可多选）</h2>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {fileEntries.length > 0 ? (
          <SortableList
            items={fileEntries}
            getItemId={fileEntryId}
            onReorder={setFileEntries}
            className="admin-batch-preview"
            itemClassName="admin-batch-file-row admin-sortable-row"
            renderItem={(entry, _index, dragHandle) => (
              <>
                {dragHandle}
                <Image
                  src={entry.previewUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="admin-batch-file-thumb"
                  unoptimized
                />
                <span className="admin-batch-file-name">{entry.file.name}</span>
              </>
            )}
          />
        ) : null}
      </section>

      <div className="admin-form-actions">
        <button type="submit" className="btn" disabled={saving || fileEntries.length === 0}>
          {saving ? "上传并保存中…" : `保存 ${fileEntries.length > 0 ? fileEntries.length : ""} 张摄影`}
        </button>
      </div>
    </form>
  );
}
