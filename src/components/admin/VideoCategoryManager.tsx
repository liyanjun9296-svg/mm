"use client";

import { useEffect, useState } from "react";
import {
  fetchCategoriesAdmin,
  getStoredAdminToken,
  saveCategoriesAdmin,
} from "@/lib/admin/api";

export default function VideoCategoryManager() {
  const [token] = useState(() => getStoredAdminToken());
  const [categories, setCategories] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchCategoriesAdmin(token)
      .then(setCategories)
      .catch((err) => {
        setStatus(err instanceof Error ? err.message : "加载分类失败");
      });
  }, [token]);

  async function persist(next: string[]) {
    await saveCategoriesAdmin(token, next);
    setCategories(next);
    setStatus("分类已保存");
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) {
      return;
    }
    if (categories.includes(name)) {
      setStatus("分类已存在");
      return;
    }
    try {
      await persist([...categories, name]);
      setNewName("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "添加失败");
    }
  }

  async function handleRemove(name: string) {
    if (categories.length <= 1) {
      setStatus("至少保留一个分类");
      return;
    }
    if (!confirm(`删除分类「${name}」？已有作品仍会保留该标签文字。`)) {
      return;
    }
    try {
      await persist(categories.filter((c) => c !== name));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <section className="admin-categories">
      <button
        type="button"
        className="admin-categories-toggle work-link"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "收起" : "展开"}视频分类管理
      </button>
      {open ? (
        <div className="admin-categories-body">
          <p className="admin-desc">此处分类会显示在首页视频 Tab 与新建视频时的下拉选项。</p>
          <ul className="admin-categories-list">
            {categories.map((name) => (
              <li key={name}>
                <span>{name}</span>
                <button type="button" className="work-link" onClick={() => void handleRemove(name)}>
                  删除
                </button>
              </li>
            ))}
          </ul>
          <div className="admin-categories-add">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新分类名，如：纪录片"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
            <button type="button" className="btn" onClick={() => void handleAdd()}>
              添加
            </button>
          </div>
          {status ? <p className="admin-status">{status}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
