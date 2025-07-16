import React, { useState, useCallback } from 'react';
import {
  SearchInput,
  Select,
  Button,
  Card,
  Text,
  Chip,
  Drawer,
  Slider,
  Checkbox
} from '@revu/ui-kit';
import type { ProfileFilter, ProfileSortOption } from '../types';
import { useProfileStore } from '../store';

interface ProfileSearchProps {
  onSearch: (query: string, filter: ProfileFilter, sort: ProfileSortOption) => void;
  loading?: boolean;
}

export const ProfileSearch: React.FC<ProfileSearchProps> = ({
  onSearch,
  loading = false
}) => {
  const { searchQuery, searchFilter, setSearchQuery, setSearchFilter } = useProfileStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localFilter, setLocalFilter] = useState<ProfileFilter>(searchFilter);
  const [sortBy, setSortBy] = useState<ProfileSortOption>('relevance');

  const handleSearch = useCallback(() => {
    setSearchQuery(localQuery);
    setSearchFilter(localFilter);
    onSearch(localQuery, localFilter, sortBy);
  }, [localQuery, localFilter, sortBy, setSearchQuery, setSearchFilter, onSearch]);

  const handleFilterChange = (key: keyof ProfileFilter, value: any) => {
    setLocalFilter({ ...localFilter, [key]: value });
  };

  const clearFilters = () => {
    setLocalFilter({});
  };

  const activeFilterCount = Object.keys(localFilter).filter(
    key => localFilter[key as keyof ProfileFilter] !== undefined
  ).length;

  return (
    <div className="profile-search">
      <div className="profile-search__bar">
        <SearchInput
          value={localQuery}
          onChange={setLocalQuery}
          onSearch={handleSearch}
          placeholder="Search influencers by name, category, or keywords..."
          loading={loading}
        />
        <Button
          variant="secondary"
          onClick={() => setShowFilters(true)}
          icon="filter"
          badge={activeFilterCount > 0 ? activeFilterCount : undefined}
        >
          Filters
        </Button>
        <Select
          value={sortBy}
          onChange={setSortBy as any}
          options={[
            { value: 'relevance', label: 'Relevance' },
            { value: 'followers_desc', label: 'Most Followers' },
            { value: 'followers_asc', label: 'Least Followers' },
            { value: 'engagement_desc', label: 'Highest Engagement' },
            { value: 'engagement_asc', label: 'Lowest Engagement' },
            { value: 'price_desc', label: 'Highest Price' },
            { value: 'price_asc', label: 'Lowest Price' },
            { value: 'rating_desc', label: 'Best Rated' },
            { value: 'created_desc', label: 'Newest' }
          ]}
        />
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="profile-search__active-filters">
          <Text variant="caption" color="secondary">Active filters:</Text>
          {localFilter.categories?.map(cat => (
            <Chip
              key={cat}
              onRemove={() => {
                const updated = localFilter.categories?.filter(c => c !== cat);
                handleFilterChange('categories', updated?.length ? updated : undefined);
              }}
            >
              {cat}
            </Chip>
          ))}
          {localFilter.minFollowers && (
            <Chip
              onRemove={() => {
                handleFilterChange('minFollowers', undefined);
                handleFilterChange('maxFollowers', undefined);
              }}
            >
              {localFilter.minFollowers}+ followers
            </Chip>
          )}
          <Button variant="ghost" size="small" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Drawer */}
      <Drawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Profiles"
        footer={
          <div className="filter-drawer__footer">
            <Button variant="secondary" onClick={clearFilters}>
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleSearch();
                setShowFilters(false);
              }}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="filter-drawer__content">
          {/* Categories */}
          <Card>
            <Text variant="h3">Categories</Text>
            <div className="filter-group">
              {['fashion', 'beauty', 'lifestyle', 'food', 'travel', 'fitness', 'tech', 'gaming'].map(cat => (
                <Checkbox
                  key={cat}
                  label={cat}
                  checked={localFilter.categories?.includes(cat as any) || false}
                  onChange={(checked) => {
                    const current = localFilter.categories || [];
                    const updated = checked
                      ? [...current, cat as any]
                      : current.filter(c => c !== cat);
                    handleFilterChange('categories', updated.length ? updated : undefined);
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Follower Range */}
          <Card>
            <Text variant="h3">Follower Range</Text>
            <Slider
              min={0}
              max={1000000}
              step={1000}
              value={[localFilter.minFollowers || 0, localFilter.maxFollowers || 1000000]}
              onChange={([min, max]) => {
                handleFilterChange('minFollowers', min > 0 ? min : undefined);
                handleFilterChange('maxFollowers', max < 1000000 ? max : undefined);
              }}
              formatLabel={(value) => value >= 1000 ? `${value / 1000}k` : value.toString()}
            />
          </Card>

          {/* Engagement Rate */}
          <Card>
            <Text variant="h3">Minimum Engagement Rate</Text>
            <Slider
              min={0}
              max={20}
              step={0.5}
              value={localFilter.minEngagement || 0}
              onChange={(value) => handleFilterChange('minEngagement', value > 0 ? value : undefined)}
              formatLabel={(value) => `${value}%`}
            />
          </Card>

          {/* Location */}
          <Card>
            <Text variant="h3">Location</Text>
            <Select
              placeholder="Select country"
              value={localFilter.location?.country}
              onChange={(value) => handleFilterChange('location', { ...localFilter.location, country: value })}
              options={[
                { value: 'US', label: 'United States' },
                { value: 'UK', label: 'United Kingdom' },
                { value: 'CA', label: 'Canada' },
                { value: 'AU', label: 'Australia' },
                // Add more countries
              ]}
            />
          </Card>

          {/* Verification Level */}
          <Card>
            <Text variant="h3">Verification Level</Text>
            <div className="filter-group">
              {['basic', 'verified', 'premium', 'elite'].map(level => (
                <Checkbox
                  key={level}
                  label={level}
                  checked={localFilter.verificationLevel?.includes(level as any) || false}
                  onChange={(checked) => {
                    const current = localFilter.verificationLevel || [];
                    const updated = checked
                      ? [...current, level as any]
                      : current.filter(l => l !== level);
                    handleFilterChange('verificationLevel', updated.length ? updated : undefined);
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      </Drawer>
    </div>
  );
};

export default ProfileSearch;