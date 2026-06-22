import { create } from "zustand";

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  autoSummary: string;
  content: string;
  tags: string[];
  mentions: string[]; // @项目名
  createdAt: string;
  updatedAt: string;
}

interface DiaryStore {
  entries: DiaryEntry[];
  activeEntryId: string | null;
  setActiveEntry: (id: string | null) => void;
  setEntries: (entries: DiaryEntry[]) => void;
  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  removeEntry: (id: string) => void;
}

async function saveEntry(entry: DiaryEntry) {
  try {
    await fetch("/api/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // ignore
  }
}

async function deleteEntryOnServer(id: string) {
  try {
    await fetch("/api/diary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch {
    // ignore
  }
}

export const useDiaryStore = create<DiaryStore>((set) => ({
  entries: [],
  activeEntryId: null,

  setActiveEntry: (id) => set({ activeEntryId: id }),

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) => {
    set((state) => ({ entries: [entry, ...state.entries] }));
    saveEntry(entry);
  },

  updateEntry: (id, updates) =>
    set((state) => {
      const entries = state.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      );
      const updated = entries.find((e) => e.id === id);
      if (updated) saveEntry(updated);
      return { entries };
    }),

  removeEntry: (id) =>
    set((state) => {
      const entry = state.entries.find((e) => e.id === id);
      if (entry) deleteEntryOnServer(entry.id);
      return {
        entries: state.entries.filter((e) => e.id !== id),
        activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
      };
    }),
}));

/** Extract @mentions from text (e.g. @liandainqi @devpulse) */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@([\w-]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}
