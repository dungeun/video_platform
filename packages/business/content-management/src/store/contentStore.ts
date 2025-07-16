import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Content, ContentFilter, ContentTemplate } from '../types';

interface ContentState {
  // Active content
  activeContent: Content | null;
  
  // Content drafts
  drafts: Map<string, Partial<Content>>;
  
  // Filter state
  contentFilter: ContentFilter;
  
  // Template favorites
  favoriteTemplates: string[];
  
  // Calendar view
  calendarView: 'month' | 'week' | 'day';
  selectedDate: Date;
  
  // Actions
  setActiveContent: (content: Content | null) => void;
  saveDraft: (id: string, draft: Partial<Content>) => void;
  removeDraft: (id: string) => void;
  getDraft: (id: string) => Partial<Content> | undefined;
  setContentFilter: (filter: ContentFilter) => void;
  toggleFavoriteTemplate: (templateId: string) => void;
  isFavoriteTemplate: (templateId: string) => boolean;
  setCalendarView: (view: 'month' | 'week' | 'day') => void;
  setSelectedDate: (date: Date) => void;
}

export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeContent: null,
        drafts: new Map(),
        contentFilter: {},
        favoriteTemplates: [],
        calendarView: 'month',
        selectedDate: new Date(),

        // Actions
        setActiveContent: (content) => set({ activeContent: content }),

        saveDraft: (id, draft) => {
          set((state) => {
            const newDrafts = new Map(state.drafts);
            newDrafts.set(id, {
              ...newDrafts.get(id),
              ...draft,
              updatedAt: new Date()
            });
            return { drafts: newDrafts };
          });
        },

        removeDraft: (id) => {
          set((state) => {
            const newDrafts = new Map(state.drafts);
            newDrafts.delete(id);
            return { drafts: newDrafts };
          });
        },

        getDraft: (id) => {
          return get().drafts.get(id);
        },

        setContentFilter: (filter) => set({ contentFilter: filter }),

        toggleFavoriteTemplate: (templateId) => {
          set((state) => {
            const favorites = state.favoriteTemplates.includes(templateId)
              ? state.favoriteTemplates.filter(id => id !== templateId)
              : [...state.favoriteTemplates, templateId];
            return { favoriteTemplates: favorites };
          });
        },

        isFavoriteTemplate: (templateId) => {
          return get().favoriteTemplates.includes(templateId);
        },

        setCalendarView: (view) => set({ calendarView: view }),

        setSelectedDate: (date) => set({ selectedDate: date })
      }),
      {
        name: 'content-management-store',
        partialize: (state) => ({
          contentFilter: state.contentFilter,
          favoriteTemplates: state.favoriteTemplates,
          calendarView: state.calendarView
        })
      }
    )
  )
);