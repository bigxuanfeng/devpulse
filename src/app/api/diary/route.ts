import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DIARY_DIR = path.join(process.cwd(), "data", "diary");

function ensureDir() {
  if (!fs.existsSync(DIARY_DIR)) fs.mkdirSync(DIARY_DIR, { recursive: true });
}

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

function serialize(entry: DiaryEntry): string {
  const frontmatter = {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    autoSummary: entry.autoSummary || "",
    tags: entry.tags,
    mentions: entry.mentions,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${entry.content}`;
}

function deserialize(name: string, raw: string): DiaryEntry | null {
  try {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
    if (!match) return null;
    const fm = JSON.parse(match[1]);
    return {
      id: fm.id || name.replace(".md", ""),
      date: fm.date || name.replace(".md", ""),
      title: fm.title || "",
      autoSummary: fm.autoSummary || "",
      tags: fm.tags ?? [],
      mentions: fm.mentions ?? [],
      content: (match[2] || "").trim(),
      createdAt: fm.createdAt || new Date().toISOString(),
      updatedAt: fm.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[diary API] Failed to deserialize entry from file", name, ":", err);
    return null;
  }
}

function readAll(): DiaryEntry[] {
  ensureDir();
  const files = fs.readdirSync(DIARY_DIR).filter((f) => f.endsWith(".md"));
  const entries: DiaryEntry[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(DIARY_DIR, f), "utf-8");
    const entry = deserialize(f, raw);
    if (entry) entries.push(entry);
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function writeOne(entry: DiaryEntry) {
  ensureDir();
  // Save with id-based name
  const name = `${entry.id}.md`;
  const filePath = path.join(DIARY_DIR, name);
  fs.writeFileSync(filePath, serialize(entry), "utf-8");

  // Clean up old date-based file if it exists (legacy migration)
  const oldName = `${entry.date}.md`;
  const oldPath = path.join(DIARY_DIR, oldName);
  if (oldName !== name && fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
}

function deleteOne(id: string) {
  const name = `${id}.md`;
  const filePath = path.join(DIARY_DIR, name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// GET - list all entries
export async function GET() {
  return NextResponse.json({ entries: readAll() });
}

// POST - save/update an entry
export async function POST(req: NextRequest) {
  const entry: DiaryEntry = await req.json();
  writeOne(entry);
  return NextResponse.json({ ok: true });
}

// DELETE - remove an entry by id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  deleteOne(id);
  return NextResponse.json({ ok: true });
}
