import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft, GitCommit, Calendar } from "lucide-react";
import { getProjects } from "@/lib/data/projects-config";
import { collectGitStats } from "@/lib/data/git-collector";

interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  autoSummary: string;
  content: string;
  tags: string[];
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

interface CommitInfo {
  hash: string;
  date: string;
  message: string;
  additions: number;
  deletions: number;
}

function readDiaryEntries(): DiaryEntry[] {
  try {
    const filePath = path.join(process.cwd(), "data", "diary.json");
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.entries ?? [];
  } catch {
    return [];
  }
}

interface Props {
  params: { name: string };
  searchParams: { page?: string; limit?: string };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { name } = params;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(searchParams.limit) || 20));
  const projects = getProjects();
  const projectConfig = projects.find((p) => p.name === name);

  if (!projectConfig) notFound();

  const stats = collectGitStats(projectConfig.path, name);
  if (!stats) notFound();

  const entries = readDiaryEntries()
    .filter((e) => e.mentions.includes(name))
    .sort((a, b) => b.date.localeCompare(a.date));

  // 分页计算
  const allCommits = stats.recentCommits;
  const totalItems = allCommits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  const currentCommits = allCommits.slice(startIndex, endIndex);

  const statusLabel: Record<string, string> = {
    active: "活跃",
    stale: "不活跃",
    dead: "已停止",
  };
  const statusColor: Record<string, string> = {
    active: "text-success",
    stale: "text-warning",
    dead: "text-error",
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors duration-150 mb-6"
      >
        <ArrowLeft size={14} />
        返回面板
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">{stats.projectName}</h1>
        <span className={`text-xs ${statusColor[stats.status]} border border-current rounded-full px-2 py-0.5`}>
          {statusLabel[stats.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="总提交" value={String(stats.totalCommits)} />
        <StatCard label="本月提交" value={String(stats.commitsThisMonth)} />
        <StatCard label="本月活跃天数" value={String(stats.activeDaysThisMonth)} />
        <StatCard label="待办 TODO" value={String(stats.todoCount)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle icon={<GitCommit size={14} />} title="提交历史" />
          <div className="bg-bg-surface rounded-md border border-border-default overflow-hidden">
            {totalItems === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">无提交记录</div>
            ) : (
              <>
                <div className="px-4 py-2 text-xs text-text-muted border-b border-border-default">
                  显示 {startIndex + 1}-{endIndex} 条，共 {totalItems} 条提交
                </div>
                <ul className="divide-y divide-border-default">
                  {currentCommits.map((c: CommitInfo) => (
                    <li key={c.hash} className="px-4 py-3 hover:bg-bg-hover transition-colors duration-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-[family-name:var(--font-data)] text-text-muted">
                          {c.date.slice(0, 10)}
                        </span>
                        <span className="text-xs font-[family-name:var(--font-data)] text-text-muted">
                          {c.hash.slice(0, 7)}
                        </span>
                      </div>
                      <div className="text-sm text-text-primary">{c.message}</div>
                      {(c.additions > 0 || c.deletions > 0) && (
                        <div className="flex gap-3 mt-1 text-xs font-[family-name:var(--font-data)]">
                          <span className="text-success">+{c.additions}</span>
                          <span className="text-error">-{c.deletions}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>每页</span>
                      {[5, 20, 50].map((l) => (
                        <a
                          key={l}
                          href={`?page=1&limit=${l}`}
                          className={`px-1.5 py-0.5 rounded ${
                            limit === l ? "bg-accent text-white" : "hover:text-accent"
                          }`}
                        >
                          {l}
                        </a>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`?page=${Math.max(1, safePage - 1)}&limit=${limit}`}
                        className={`px-2 py-1 text-xs border border-border-default rounded hover:border-accent transition-colors duration-150 ${
                          safePage <= 1 ? "opacity-30 pointer-events-none" : ""
                        }`}
                      >
                        上一页
                      </a>

                      {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisible = 5;
                        
                        if (totalPages <= maxVisible + 2) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (safePage > 3) pages.push("...");
                          
                          const start = Math.max(2, safePage - 1);
                          const end = Math.min(totalPages - 1, safePage + 1);
                          for (let i = start; i <= end; i++) pages.push(i);
                          
                          if (safePage < totalPages - 2) pages.push("...");
                          pages.push(totalPages);
                        }
                        
                        return pages.map((p, idx) =>
                          typeof p === "string" ? (
                            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-text-muted">
                              ...
                            </span>
                          ) : (
                            <a
                              key={p}
                              href={`?page=${p}&limit=${limit}`}
                              className={`px-2.5 py-1 text-xs border rounded transition-colors duration-150 ${
                                safePage === p
                                  ? "bg-accent text-white border-accent"
                                  : "border-border-default hover:border-accent"
                              }`}
                            >
                              {p}
                            </a>
                          )
                        );
                      })()}

                      <a
                        href={`?page=${Math.min(totalPages, safePage + 1)}&limit=${limit}`}
                        className={`px-2 py-1 text-xs border border-border-default rounded hover:border-accent transition-colors duration-150 ${
                          safePage >= totalPages ? "opacity-30 pointer-events-none" : ""
                        }`}
                      >
                        下一页
                      </a>
                    </div>

                    <div className="text-xs text-text-muted">
                      第 {safePage} / {totalPages} 页
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SectionTitle title="本月代码变动" />
          <div className="bg-bg-surface rounded-md border border-border-default p-4">
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-xl font-semibold text-success font-[family-name:var(--font-data)]">
                  +{stats.additionsThisMonth}
                </div>
                <div className="text-xs text-text-muted mt-1">新增</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-error font-[family-name:var(--font-data)]">
                  -{stats.deletionsThisMonth}
                </div>
                <div className="text-xs text-text-muted mt-1">删除</div>
              </div>
              <div>
                <div className={`text-xl font-semibold font-[family-name:var(--font-data)] ${
                  stats.additionsThisMonth - stats.deletionsThisMonth >= 0 ? "text-success" : "text-error"
                }`}>
                  {stats.additionsThisMonth - stats.deletionsThisMonth >= 0 ? "+" : ""}
                  {stats.additionsThisMonth - stats.deletionsThisMonth}
                </div>
                <div className="text-xs text-text-muted mt-1">净增</div>
              </div>
            </div>
          </div>

          <SectionTitle icon={<Calendar size={14} />} title="关联日记" />
          <div className="bg-bg-surface rounded-md border border-border-default">
            {entries.length === 0 ? (
              <div className="px-4 py-6 text-center text-text-muted text-sm">无关联日记</div>
            ) : (
              <ul className="divide-y divide-border-default">
                {entries.slice(0, 10).map((e) => (
                  <li key={e.id} className="px-4 py-2.5 hover:bg-bg-hover transition-colors duration-100">
                    <Link
                      href={`/diary?date=${e.date}`}
                      className="text-sm text-text-primary hover:text-accent transition-colors duration-150"
                    >
                      {e.title || e.date}
                    </Link>
                    {e.title && (
                      <span className="text-xs text-text-muted ml-2">{e.date}</span>
                    )}
                    {e.autoSummary && (
                      <div className="text-xs text-text-muted mt-0.5">{e.autoSummary}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SectionTitle title="项目路径" />
          <div className="bg-bg-surface rounded-md border border-border-default p-3">
            <code className="text-xs text-text-secondary font-[family-name:var(--font-data)] break-all">
              {stats.projectPath}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-surface rounded-md border border-border-default p-4 text-center">
      <div className="text-2xl font-semibold text-text-primary font-[family-name:var(--font-data)]">
        {value}
      </div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-3">
      {icon}
      {title}
    </h3>
  );
}
