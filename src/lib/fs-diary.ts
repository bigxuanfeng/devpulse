import type { DiaryEntry } from "@/stores/diary";

const DIR_HANDLE_KEY = "devpulse-diary-dir";

export function isSupported(): boolean {
  return "showDirectoryPicker" in window;
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    localStorage.setItem(DIR_HANDLE_KEY, "1"); // mark as picked
    return handle;
  } catch {
    return null; // user cancelled
  }
}

export async function hasStoredPermission(): Promise<boolean> {
  return localStorage.getItem(DIR_HANDLE_KEY) === "1";
}

async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  // Try to regain permission for previously picked directory
  // We can't re-get the handle directly, so we store a flag and re-prompt
  if (!(await hasStoredPermission())) return null;

  // We need user gesture to re-request. Return flag to trigger UI.
  // Actual handle must be re-obtained via pickDirectory()
  return null;
}

function fileNameFromDate(date: string): string {
  return `${date}.md`;
}

function serializeEntry(entry: DiaryEntry): string {
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

function deserializeEntry(fileName: string, content: string): DiaryEntry | null {
  try {
    const match = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
    if (!match) return null;

    const frontmatter = JSON.parse(match[1]);
    const body = match[2];

    return {
      id: frontmatter.id,
      date: frontmatter.date,
      title: frontmatter.title || "",
      autoSummary: frontmatter.autoSummary || "",
      tags: frontmatter.tags ?? [],
      mentions: frontmatter.mentions ?? [],
      content: body.trim(),
      createdAt: frontmatter.createdAt,
      updatedAt: frontmatter.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function writeEntry(
  dirHandle: FileSystemDirectoryHandle,
  entry: DiaryEntry
): Promise<void> {
  const name = fileNameFromDate(entry.date);
  const content = serializeEntry(entry);

  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function deleteFile(
  dirHandle: FileSystemDirectoryHandle,
  date: string
): Promise<void> {
  const name = fileNameFromDate(date);
  await dirHandle.removeEntry(name);
}

export async function readAllEntries(
  dirHandle: FileSystemDirectoryHandle
): Promise<DiaryEntry[]> {
  const entries: DiaryEntry[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".md")) continue;

    try {
      const file = await (handle as FileSystemFileHandle).getFile();
      const content = await file.text();
      const entry = deserializeEntry(name, content);
      if (entry) entries.push(entry);
    } catch {
      // skip corrupted files
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
