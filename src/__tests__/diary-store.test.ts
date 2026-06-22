import { useDiaryStore } from "@/stores/diary";
import type { DiaryEntry } from "@/stores/diary";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Diary Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDiaryStore.getState().setEntries([]);
  });

  it("should add a new entry", () => {
    const { addEntry } = useDiaryStore.getState();
    
    const newEntry: DiaryEntry = {
      id: "test-1",
      date: "2026-06-22",
      title: "Test Entry",
      content: "Test content",
      tags: ["test"],
      mentions: ["devpulse"],
      autoSummary: "",
      createdAt: "2026-06-22T10:00:00Z",
      updatedAt: "2026-06-22T10:00:00Z",
    };

    addEntry(newEntry);

    const entries = useDiaryStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("test-1");
    expect(entries[0].title).toBe("Test Entry");
  });

  it("should update an entry", () => {
    const { addEntry, updateEntry } = useDiaryStore.getState();
    
    const entry: DiaryEntry = {
      id: "test-1",
      date: "2026-06-22",
      title: "Original Title",
      content: "Original content",
      tags: [],
      mentions: [],
      autoSummary: "",
      createdAt: "2026-06-22T10:00:00Z",
      updatedAt: "2026-06-22T10:00:00Z",
    };

    addEntry(entry);
    updateEntry("test-1", { title: "Updated Title", content: "Updated content" });

    const updated = useDiaryStore.getState().entries[0];
    expect(updated.title).toBe("Updated Title");
    expect(updated.content).toBe("Updated content");
  });

  it("should remove an entry", () => {
    const { addEntry, removeEntry } = useDiaryStore.getState();
    
    const entry: DiaryEntry = {
      id: "test-1",
      date: "2026-06-22",
      title: "Test Entry",
      content: "Test content",
      tags: [],
      mentions: [],
      autoSummary: "",
      createdAt: "2026-06-22T10:00:00Z",
      updatedAt: "2026-06-22T10:00:00Z",
    };

    addEntry(entry);
    expect(useDiaryStore.getState().entries).toHaveLength(1);

    removeEntry("test-1");
    expect(useDiaryStore.getState().entries).toHaveLength(0);
  });

  it("should set active entry", () => {
    const { setActiveEntry } = useDiaryStore.getState();
    
    setActiveEntry("test-1");
    expect(useDiaryStore.getState().activeEntryId).toBe("test-1");

    setActiveEntry(null);
    expect(useDiaryStore.getState().activeEntryId).toBeNull();
  });
});
