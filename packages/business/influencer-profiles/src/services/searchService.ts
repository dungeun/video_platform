import { BaseService } from '@revu/core';
import type {
  InfluencerProfile,
  ProfileFilter,
  ProfileSortOption,
  SocialPlatform,
  InfluencerCategory
} from '../types';

export interface SearchResult {
  profiles: InfluencerProfile[];
  facets: SearchFacets;
  total: number;
  page: number;
  totalPages: number;
  took: number;
}

export interface SearchFacets {
  categories: FacetItem[];
  platforms: FacetItem[];
  locations: FacetItem[];
  priceRanges: FacetItem[];
  followerRanges: FacetItem[];
  verificationLevels: FacetItem[];
}

export interface FacetItem {
  value: string;
  count: number;
  label?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filter: ProfileFilter;
  createdAt: Date;
  updatedAt: Date;
  notifications: boolean;
}

export class SearchService extends BaseService {
  async search(
    query?: string,
    filter?: ProfileFilter,
    sort?: ProfileSortOption,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    return this.post<SearchResult>('/influencer-profiles/search', {
      query,
      filter,
      sort,
      page,
      limit
    });
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.get<string[]>('/influencer-profiles/search/suggestions', {
      params: { query }
    });
  }

  async getTrendingInfluencers(
    category?: InfluencerCategory,
    platform?: SocialPlatform
  ): Promise<InfluencerProfile[]> {
    return this.get<InfluencerProfile[]>('/influencer-profiles/trending', {
      params: { category, platform }
    });
  }

  async getSimilarProfiles(
    profileId: string,
    limit: number = 10
  ): Promise<InfluencerProfile[]> {
    return this.get<InfluencerProfile[]>(
      `/influencer-profiles/${profileId}/similar`,
      { params: { limit } }
    );
  }

  async saveSearch(
    name: string,
    filter: ProfileFilter,
    notifications: boolean = false
  ): Promise<SavedSearch> {
    return this.post<SavedSearch>('/influencer-profiles/saved-searches', {
      name,
      filter,
      notifications
    });
  }

  async getSavedSearches(): Promise<SavedSearch[]> {
    return this.get<SavedSearch[]>('/influencer-profiles/saved-searches');
  }

  async updateSavedSearch(
    searchId: string,
    updates: Partial<SavedSearch>
  ): Promise<SavedSearch> {
    return this.put<SavedSearch>(
      `/influencer-profiles/saved-searches/${searchId}`,
      updates
    );
  }

  async deleteSavedSearch(searchId: string): Promise<void> {
    return this.delete(`/influencer-profiles/saved-searches/${searchId}`);
  }

  async getDiscoverFeed(
    interests?: string[],
    excludeIds?: string[]
  ): Promise<InfluencerProfile[]> {
    return this.get<InfluencerProfile[]>('/influencer-profiles/discover', {
      params: { interests, excludeIds }
    });
  }

  async getFilterOptions(): Promise<{
    categories: InfluencerCategory[];
    platforms: SocialPlatform[];
    locations: string[];
    languages: string[];
    tags: string[];
  }> {
    return this.get('/influencer-profiles/filter-options');
  }

  async trackSearchQuery(
    query: string,
    resultCount: number,
    clickedProfileIds?: string[]
  ): Promise<void> {
    return this.post('/influencer-profiles/search/track', {
      query,
      resultCount,
      clickedProfileIds
    });
  }
}