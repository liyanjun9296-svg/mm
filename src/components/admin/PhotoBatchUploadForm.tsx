"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem } from "@/features/portfolio/types";
import {
  defaultMediaKey,
  fetchWorksAdmin,
  formatUploadFailure,
  getStoredAdminToken,
  saveWorkItemsBatchAdmin,
  slugify,
  titleFromFilename,
  uploadFileAdmin,
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

export default function PhotoBatchUploadForm({ locale }: PhotoBatchUploadFormProps) {
  const router = useRouter();
  const [token] = useState(() => getStoredAdminToken());
  const [allWorks, setAllWorks] = useState<WorkItem[]>([]);
  const [meta, setMeta] = useState<SharedMeta>(defaultMeta);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

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

  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function updateMeta<K extends keyof SharedMeta>(key: K, value: SharedMeta[K]) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles(picked);
    setStatus(picked.length > 0 ? `已选择 ${picked.length} 张图片` : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setStatus("请先选择要上传的图片");
      return;
    }

    setSaving(true);
    const newItems: WorkItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`正在上传 ${i + 1} / ${files.length}：${file.name}`);
        const url = await uploadFileAdmin(
          token,
          file,
          defaultMediaKey(file, "works/gallery"),
        );
        const title = titleFromFilename(file.name);

        newItems.push({
          slug: uniquePhotoSlug(title, i),
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
              placeholder="小红书 / 官网"
            />
          </label>
        </div>
      </section>

      <section className="admin-upload-section">
        <h2>选择图片（可多选）</h2>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {previews.length > 0 ? (
          <ul className="admin-batch-preview">
            {previews.map((src, i) => (
              <li key={src}>
                <Image src={src} alt="" width={120} height={120} unoptimized />
                <span>{files[i]?.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="admin-form-actions">
        <button type="submit" className="btn" disabled={saving || files.length === 0}>
          {saving ? "上传并保存中…" : `保存 ${files.length > 0 ? files.length : ""} 张摄影`}
        </button>
      </div>
    </form>
  );
}
