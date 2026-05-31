"use client";

import { useMemo, useState } from "react";
import {
  defaultMediaKey,
  formatUploadFailure,
  guessContentType,
  uploadFileAdmin,
  confirmVideoUpload,
} from "@/lib/admin/api";

function defaultKey(file: File): string {
  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
  const folder = isVideo ? "works/videos" : "works/covers";
  return defaultMediaKey(file, folder);
}

export default function CosUploadForm() {
  const [token, setToken] = useState("");
  const [cosKey, setCosKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const contentType = useMemo(() => (file ? guessContentType(file) : ""), [file]);

  async function handleUpload() {
    if (!file) {
      setStatus("请先选择文件");
      return;
    }
    if (!token.trim()) {
      setStatus("请填写 ADMIN_UPLOAD_TOKEN");
      return;
    }
    if (!confirmVideoUpload(file)) {
      return;
    }

    const key = (cosKey || defaultKey(file)).replace(/^\/+/, "");
    const autoKey = defaultKey(file);
    if (cosKey && cosKey.replace(/^\/+/, "") !== autoKey.replace(/^\/+/, "")) {
      const reuse = window.confirm(
        "你使用了手动 COS 路径。若该路径已存在文件，覆盖后可能产生历史版本或冗余。\n建议留空让系统自动生成新路径。\n\n仍用此路径上传？",
      );
      if (!reuse) {
        return;
      }
    }
    setUploading(true);
    setStatus("正在上传到 COS…");
    setPublicUrl("");

    try {
      const url = await uploadFileAdmin(token.trim(), file, key);
      setPublicUrl(url);
      setStatus("上传成功，请复制下方 URL 到作品表单");
    } catch (error) {
      setStatus(formatUploadFailure(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cos-upload">
      <p className="cos-upload-hint">
        视频与大于 4MB 的文件将<strong>直传 COS</strong>（需在 Bucket 配置 CORS）；小图可走本站中转。
        成功后把公网 URL 填入作品的 <code>mediaUrl</code> 或 <code>coverImage</code>。
      </p>

      <label className="cos-upload-field">
        <span>管理口令 (ADMIN_UPLOAD_TOKEN)</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="与 .env.local 中一致"
          autoComplete="off"
        />
      </label>

      <label className="cos-upload-field">
        <span>选择文件</span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null;
            setFile(next);
            if (next && !cosKey) {
              setCosKey(defaultKey(next));
            }
          }}
        />
      </label>

      <label className="cos-upload-field">
        <span>COS 对象键（可选，默认自动生成）</span>
        <input
          type="text"
          value={cosKey}
          onChange={(e) => setCosKey(e.target.value)}
          placeholder="works/videos/demo.mp4（建议英文路径）"
        />
      </label>

      {file ? (
        <p className="cos-upload-meta">
          文件：{file.name}（{(file.size / 1024 / 1024).toFixed(2)} MB） · Content-Type:{" "}
          {contentType || guessContentType(file)}
        </p>
      ) : null}

      <button type="button" className="btn" onClick={handleUpload} disabled={uploading}>
        {uploading ? "上传中…" : "上传到 COS"}
      </button>

      {status ? <p className="cos-upload-status">{status}</p> : null}

      {publicUrl ? (
        <div className="cos-upload-result">
          <p>公网 URL：</p>
          <code className="cos-upload-url">{publicUrl}</code>
          <p className="cos-upload-hint">
            若替换了旧视频/封面，旧 COS 文件不会自动删除。可运行{" "}
            <code>npm run cos:prune-orphans</code> 清理未引用文件。
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => navigator.clipboard.writeText(publicUrl)}
          >
            复制 URL
          </button>
        </div>
      ) : null}
    </div>
  );
}
