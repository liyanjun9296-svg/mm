"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredAdminToken } from "@/lib/admin/api";

type AdminLoginFormProps = {
  locale: string;
};

export default function AdminLoginForm({ locale }: AdminLoginFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/works", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (!res.ok) {
        throw new Error("口令错误或未配置 ADMIN_UPLOAD_TOKEN");
      }
      setStoredAdminToken(token.trim());
      router.push(`/${locale}/admin/works`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login" onSubmit={handleSubmit}>
      <h1 className="admin-title">作品管理后台</h1>
      <p className="admin-desc">输入管理口令后即可上传视频与摄影、编辑分类并管理作品详情。</p>
      <label className="admin-field">
        <span>管理口令</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="与 .env.local 中 ADMIN_UPLOAD_TOKEN 一致"
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "验证中…" : "进入后台"}
      </button>
    </form>
  );
}
