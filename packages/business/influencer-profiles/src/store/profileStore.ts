import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { InfluencerProfile, ProfileFilter } from '../types';

interface ProfileState {
  // Current user's profile
  myProfile: InfluencerProfile | null;
  
  // Cached profiles
  profileCache: Map<string, InfluencerProfile>;
  
  // Search state
  searchQuery: string;
  searchFilter: ProfileFilter;
  recentSearches: string[];
  
  // View preferences
  viewMode: 'grid' | 'list';
  favoriteProfiles: string[];
  
  // Actions
  setMyProfile: (profile: InfluencerProfile | null) => void;
  cacheProfile: (profile: InfluencerProfile) => void;
  getCachedProfile: (profileId: string) => InfluencerProfile | undefined;
  setSearchQuery: (query: string) => void;
  setSearchFilter: (filter: ProfileFilter) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleFavorite: (profileId: string) => void;
  isFavorite: (profileId: string) => boolean;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        myProfile: null,
        profileCache: new Map(),
        searchQuery: '',
        searchFilter: {},
        recentSearches: [],
        viewMode: 'grid',
        favoriteProfiles: [],

        // Actions
        setMyProfile: (profile) => set({ myProfile: profile }),

        cacheProfile: (profile) => {
          set((state) => {
            const newCache = new Map(state.profileCache);
            newCache.set(profile.id, profile);
            // Limit cache size
            if (newCache.size > 100) {
              const firstKey = newCache.keys().next().value;
              newCache.delete(firstKey);
            }
            return { profileCache: newCache };
          });
        },

        getCachedProfile: (profileId) => {
          return get().profileCache.get(profileId);
        },

        setSearchQuery: (query) => set({ searchQuery: query }),

        setSearchFilter: (filter) => set({ searchFilter: filter }),

        addRecentSearch: (query) => {
          set((state) => {
            const searches = [query, ...state.recentSearches.filter(s => s !== query)];
            return { recentSearches: searches.slice(0, 10) };
          });
        },

        clearRecentSearches: () => set({ recentSearches: [] }),

        setViewMode: (mode) => set({ viewMode: mode }),

        toggleFavorite: (profileId) => {
          set((state) => {
            const favorites = state.favoriteProfiles.includes(profileId)
              ? state.favoriteProfiles.filter(id => id !== profileId)
              : [...state.favoriteProfiles, profileId];
            return { favoriteProfiles: favorites };
          });
        },

        isFavorite: (profileId) => {
          return get().favoriteProfiles.includes(profileId);
        }
      }),
      {
        name: 'influencer-profile-store',
        partialize: (state) => ({
          recentSearches: state.recentSearches,
          viewMode: state.viewMode,
          favoriteProfiles: state.favoriteProfiles
        })
      }
    )
  )
);