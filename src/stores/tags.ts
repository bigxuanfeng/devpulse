"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const PRESET_TAGS = [
  "#踩坑", "#架构决策", "#性能优化", "#学到了", "#想法", "#部署", "#重构",
];

interface TagsStore {
  customTags: string[];
  customProjects: string[];
  tagOrder: string[];
  projectOrder: string[];
  addTag: (tag: string) => void;
  addProject: (project: string) => void;
  removeTag: (tag: string) => void;
  removeProject: (project: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  renameProject: (oldName: string, newName: string) => void;
  reorderTags: (order: string[]) => void;
  reorderProjects: (order: string[]) => void;
  getAllTags: () => string[];
  getAllProjects: () => string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useTagsStore = create<TagsStore>()(
  persist(
    (set, get) => ({
      customTags: [],
      customProjects: [],
      tagOrder: [...PRESET_TAGS],
      projectOrder: [],
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addTag: (tag) => {
        const { customTags, tagOrder } = get();
        if (tagOrder.includes(tag)) return;
        const newOrder = [...tagOrder, tag];
        const newCustom = PRESET_TAGS.includes(tag) ? customTags : [...customTags, tag];
        set({ customTags: newCustom, tagOrder: newOrder });
      },

      addProject: (project) => {
        const { customProjects, projectOrder } = get();
        if (customProjects.includes(project)) return;
        const newCustom = [...customProjects, project];
        const newOrder = [...projectOrder, project];
        set({ customProjects: newCustom, projectOrder: newOrder });
      },

      removeTag: (tag) => {
        const { customTags, tagOrder } = get();
        set({
          customTags: customTags.filter((t) => t !== tag),
          tagOrder: tagOrder.filter((t) => t !== tag),
        });
      },

      removeProject: (project) => {
        const { customProjects, projectOrder } = get();
        set({
          customProjects: customProjects.filter((p) => p !== project),
          projectOrder: projectOrder.filter((p) => p !== project),
        });
      },

      renameTag: (oldName, newName) => {
        const { customTags, tagOrder } = get();
        const wasPreset = PRESET_TAGS.includes(oldName);
        const newCustom = wasPreset
          ? [...customTags, newName]
          : customTags.map((t) => (t === oldName ? newName : t));
        const newOrder = tagOrder.map((t) => (t === oldName ? newName : t));
        set({ customTags: newCustom, tagOrder: newOrder });
      },

      renameProject: (oldName, newName) => {
        const { customProjects, projectOrder } = get();
        set({
          customProjects: customProjects.map((p) => (p === oldName ? newName : p)),
          projectOrder: projectOrder.map((p) => (p === oldName ? newName : p)),
        });
      },

      reorderTags: (order) => set({ tagOrder: order }),
      reorderProjects: (order) => set({ projectOrder: order }),

      getAllTags: () => get().tagOrder,
      getAllProjects: () => get().projectOrder,
    }),
    {
      name: "devpulse-tags",
      partialize: (state) => ({
        customTags: state.customTags,
        customProjects: state.customProjects,
        tagOrder: state.tagOrder.length > 0 ? state.tagOrder : [...PRESET_TAGS, ...state.customTags],
        projectOrder: state.projectOrder,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Initialize tag order with presets if empty
          if (state.tagOrder.length === 0) {
            state.tagOrder = [...PRESET_TAGS, ...state.customTags];
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
