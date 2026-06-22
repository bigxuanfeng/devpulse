"use client";

import { useState, useEffect } from "react";
import {
  FolderPlus,
  Trash2,
  Check,
  AlertCircle,
  Download,
  Key,
  FolderGit2,
} from "lucide-react";

interface Project {
  name: string;
  path: string;
  isGitRepo: boolean;
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const fetchProjects = () => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
  }, []);

  const handleAddProject = () => {
    setAddError("");
    setAddSuccess(false);

    if (!newName.trim() || !newPath.trim()) {
      setAddError("名称和路径都不能为空");
      return;
    }

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), path: newPath.trim() }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error); });
        return r.json();
      })
      .then((data) => {
        if (!data.isGitRepo) {
          setAddError("警告：该路径不是 Git 仓库，Git 统计将无法工作");
        } else {
          setAddSuccess(true);
          setTimeout(() => setAddSuccess(false), 2000);
        }
        setNewName("");
        setNewPath("");
        fetchProjects();
      })
      .catch((e) => {
        setAddError(e.message || "添加失败");
      });
  };

  const handleRemoveProject = (name: string) => {
    fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(() => fetchProjects());
  };

  const handleExportData = () => {
    // Export diary entries as JSON
    fetch("/api/diary")
      .then((r) => r.json())
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devpulse-diary-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;

    // We need to save to .env.local — but we can't do that from the client.
    // Instead, we'll use a new API endpoint
    fetch("/api/settings/env", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ DEEPSEEK_API_KEY: apiKey.trim() }),
    })
      .then((r) => r.json())
      .then(() => {
        setApiKeySaved(true);
        setApiKey("");
        setTimeout(() => setApiKeySaved(false), 2000);
      })
      .catch(() => {
        setAddError("保存 API Key 失败");
      });
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 w-full">
      <h1 className="text-xl font-semibold text-text-primary mb-6">设置</h1>

      {/* Project Management */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FolderGit2 size={18} className="text-text-secondary" />
          <h2 className="text-lg font-medium text-text-primary">项目仓库管理</h2>
        </div>

        <div className="bg-bg-surface rounded-md shadow-card border border-border-default">
          {/* Project List */}
          <div className="divide-y divide-border-default">
            {loading ? (
              <div className="px-4 py-6 text-sm text-text-muted">加载中...</div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-6 text-sm text-text-muted">
                还没有配置任何项目，在下方添加
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.name}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-text-primary font-medium">
                      {p.name}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      {p.path}
                    </span>
                    {p.isGitRepo ? (
                      <span className="text-xs text-success flex items-center gap-0.5">
                        <Check size={12} />
                        Git
                      </span>
                    ) : (
                      <span className="text-xs text-error flex items-center gap-0.5">
                        <AlertCircle size={12} />
                        非 Git 仓库
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveProject(p.name)}
                    className="text-text-muted hover:text-error transition-colors duration-150 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Project */}
          <div className="px-4 py-3 border-t border-border-default">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="项目名称"
                className="flex-1 px-3 py-2 bg-bg-root border border-border-default rounded-sm text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent transition-colors duration-150"
              />
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="项目路径（如 C:/Users/.../my-project）"
                className="flex-[2] px-3 py-2 bg-bg-root border border-border-default rounded-sm text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent transition-colors duration-150"
              />
              <button
                onClick={handleAddProject}
                disabled={!newName.trim() || !newPath.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <FolderPlus size={14} />
                添加
              </button>
            </div>
            {addError && (
              <div className="mt-2 text-xs text-error">{addError}</div>
            )}
            {addSuccess && (
              <div className="mt-2 text-xs text-success flex items-center gap-1">
                <Check size={12} />
                添加成功
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DeepSeek API Key */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-text-secondary" />
          <h2 className="text-lg font-medium text-text-primary">DeepSeek API Key</h2>
        </div>

        <div className="bg-bg-surface rounded-md shadow-card border border-border-default p-4">
          <p className="text-sm text-text-secondary mb-3">
            用于追踪 AI 成本。在{" "}
            <a
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              DeepSeek 平台
            </a>{" "}
            获取 API Key。
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 bg-bg-root border border-border-default rounded-sm text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent transition-colors duration-150 font-[family-name:var(--font-data)]"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              保存
            </button>
          </div>
          {apiKeySaved && (
            <div className="mt-2 text-xs text-success flex items-center gap-1">
              <Check size={12} />
              API Key 已保存，刷新页面生效
            </div>
          )}
          <p className="text-xs text-text-muted mt-2">
            Key 保存在 .env.local 文件中，不会上传到 Git
          </p>
        </div>
      </section>

      {/* Data Export */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-text-secondary" />
          <h2 className="text-lg font-medium text-text-primary">数据导出</h2>
        </div>

        <div className="bg-bg-surface rounded-md shadow-card border border-border-default p-4">
          <p className="text-sm text-text-secondary mb-3">
            导出所有日记数据为 JSON 文件，用于备份或迁移。
          </p>
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-4 py-2 bg-bg-hover text-text-primary border border-border-default rounded-sm text-sm font-medium transition-colors duration-150 hover:border-accent"
          >
            <Download size={14} />
            导出日记数据
          </button>
        </div>
      </section>

      {/* About */}
      <section>
        <div className="bg-bg-surface rounded-md shadow-card border border-border-default p-4">
          <h2 className="text-sm font-medium text-text-primary mb-2">关于</h2>
          <p className="text-xs text-text-muted">
            DevPulse v0.1.0 · 开发者个人效能面板
          </p>
          <p className="text-xs text-text-muted mt-1">
            Next.js {`{16}`} · Tailwind CSS v4 · Milkdown · Recharts · Zustand
          </p>
        </div>
      </section>
    </div>
  );
}
